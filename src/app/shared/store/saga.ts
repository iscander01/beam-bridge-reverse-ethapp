import {
  call, take, fork, takeLatest, put, select
} from 'redux-saga/effects';

import { actions as mainActions } from '@app/containers/Main/store/index';
import store from '../../../index';

import { actions } from '@app/shared/store/index';
import { CURRENCIES, CURRENCY_IDS } from '@app/shared/constants';
import delay from '@redux-saga/delay-p';
import { loadTransactions } from './actions';
import { Transaction } from '../interface';

const API_URL = 'https://explorer-api.beam.mw/bridges';

async function loadTrs(address: string, contract: string, chain: string | number): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/tokens_transfer/${address}/${contract}/${chain}`);
    if (response.status === 200) {
      const promise = await response.json();
      return promise;
    }
  } catch (error) {
    console.log(error)
  }

  return [];
}

export function* loadTransactionsSaga(action: ReturnType<typeof actions.loadTransactions.request>): Generator {
  try {
    const ratesApiResponse = (yield call(loadTrs,
      action.payload.address,
      CURRENCIES[action.payload.chain][CURRENCY_IDS.BEAM].ethTokenContract,
      action.payload.chain,
    )) as Transaction[];

    store.dispatch(loadTransactions.success(ratesApiResponse));
  } catch (e) {
    console.log(e);
  }

  yield delay(5000);
  yield call(loadTransactions.request, {
    address: action.payload.address,
    chain: action.payload.chain,
  });
}


function* sharedSaga() {
  yield takeLatest(actions.loadTransactions.request, loadTransactionsSaga);
}

export default sharedSaga;
