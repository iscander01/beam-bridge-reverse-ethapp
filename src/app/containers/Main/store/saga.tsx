import { call, delay, put, takeLatest } from 'redux-saga/effects';
import store from '@app/index';

import { actions } from '.';
import { GasPriceItem, GasPriceResponse, RatesApiResponse } from '../interfaces';

const FETCH_INTERVAL = 5000;
const API_URL = 'https://explorer-api.beam.mw/bridges';

async function loadRatesCached(): Promise<RatesApiResponse> {
  try {
    const response = await fetch(`${API_URL}/rates`);
    if (response.status === 200) {
      const promise = await response.json();
      return promise;
    }
  } catch (error) {
    console.log(error)
  }

  return {};
}

export function* loadRatesSaga(): Generator {
  while (true) {
    try {
      const ratesApiResponse: RatesApiResponse = (yield call(loadRatesCached)) as RatesApiResponse;
      yield put(actions.loadRates.success(ratesApiResponse));
    } catch (error) {
      yield put(actions.loadRates.failure(error));
    }
    yield delay(FETCH_INTERVAL);
  }
}

async function loadGasPricesApiCall(): Promise<GasPriceResponse> {
  try {
    const response = await fetch(`${API_URL}/gasprices`);
    return await response.json();
  } catch (error) {
    console.log(error);
  }

  return {};
}

export function* loadGasPricesSaga(action: ReturnType<typeof actions.loadGasPrices.request>): Generator {
  try {
    const gasPricesResponse = (yield call(loadGasPricesApiCall)) as GasPriceItem;
    const gasPrices = Object.entries(gasPricesResponse).map(([network, gasPriceValue]) => {
      return [network, gasPriceValue.gasPrice.hex];
    });
    const result = Object.fromEntries(gasPrices);
    yield put(actions.loadGasPrices.success(result));
  } catch (e) {
    yield put(actions.loadGasPrices.failure(e));
  }
}


function* mainSaga() {
    yield takeLatest(actions.loadRates.request, loadRatesSaga);
    yield takeLatest(actions.loadGasPrices.request, loadGasPricesSaga);
}

export default mainSaga;
