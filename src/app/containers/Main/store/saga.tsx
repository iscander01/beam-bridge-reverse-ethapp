import { call, put, takeLatest, select } from 'redux-saga/effects';
import { actions } from '.';
import store from '../../../../index';
import { selectSystemState } from '@app/shared/store/selectors';
import { Balance, Currency } from '@app/core/types';
import { CURRENCIES, ethId } from '@app/shared/constants';
import MetaMaskController  from '@core/MetaMask';

const metaMaskController = MetaMaskController.getInstance();

const FETCH_INTERVAL = 310000;
const PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
const RESERVE_PRICE_API_URL = 'https://explorer-api.beam.mw/bridges/rates';

async function callLoadEthBalance(account: string) {
  return await metaMaskController.loadEthBalance(account);
}

async function callLoadTokenBalance(curr: Currency, account: string) {
  return await metaMaskController.loadTokenBalance(curr, account);
}

async function callLoadAllowance(curr: Currency, account: string) {
  return await metaMaskController.loadAllowance(curr, account);
}

export function* loadParamsSaga(
    action: ReturnType<typeof actions.loadAppParams.request>,
  ) : Generator {
    const systemState = (yield select(selectSystemState())) as {account: string};
    const balances: Balance[] = [];
    
    for(let curr of CURRENCIES) {
      const balanceValue = (curr.id === ethId ? 
        yield call(callLoadEthBalance, systemState.account) :
        yield call(callLoadTokenBalance, curr, systemState.account)) as number;
      const isAllowed = curr.id === ethId ? true : (yield call(callLoadAllowance, curr, systemState.account)) as boolean;
      
      balances.push({
        curr_id: curr.id,
        icon: curr.name.toLowerCase(),
        rate_id: curr.rate_id,
        value: balanceValue,
        is_approved: isAllowed
      });
    }
    yield put(actions.loadAppParams.success(balances));
}

async function loadRatesApiCall(rate_ids) {
  let response;
  try {
    response = await fetch(`${PRICE_API_URL}?ids=${rate_ids.join(',')}&vs_currencies=usd`);
  } catch (e) {
    response = await fetch(RESERVE_PRICE_API_URL);
  }
  const promise = await response.json();
  return promise;
}

export function* loadRate() {
  try {
    let rate_ids = [];
    for (let curr of CURRENCIES) {
      rate_ids.push(curr.rate_id);
    }
    const result = yield call(loadRatesApiCall, rate_ids);

    yield put(actions.loadRate.success(result));
    setTimeout(() => store.dispatch(actions.loadRate.request()), FETCH_INTERVAL);
  } catch (e) {
    yield put(actions.loadRate.failure(e));
  }
}

function* mainSaga() {
    yield takeLatest(actions.loadAppParams.request, loadParamsSaga);
    yield takeLatest(actions.loadRate.request, loadRate);
}

export default mainSaga;
