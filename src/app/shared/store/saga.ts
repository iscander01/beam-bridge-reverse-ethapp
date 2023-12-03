import {
  call, take, fork, takeLatest, put, select
} from 'redux-saga/effects';

import { eventChannel, END } from 'redux-saga';
import { actions as mainActions } from '@app/containers/Main/store/index';
import { navigate, setAccountState, setIsCorrectNetwork } from '@app/shared/store/actions';
import store from '../../../index';

import { actions } from '@app/shared/store/index';
import { ROUTES, CURRENCIES, ethId } from '@app/shared/constants';
import MetaMaskController from '@core/MetaMask';
import MetaMaskOnboarding from '@metamask/onboarding';
import { setIsLocked, setIsLoggedIn, setPopupState } from '@app/containers/Main/store/actions';
import delay from '@redux-saga/delay-p';

const metaMaskController = MetaMaskController.getInstance();

const GOERLI_CHAIN_ID = '5';

function initApp(account: string) {
  store.dispatch(setAccountState(account));
  store.dispatch(setIsLoggedIn(true));
  metaMaskController.init();
  store.dispatch(mainActions.loadRate.request());
}

export function remoteEventChannel() {
  return eventChannel((emitter) => {
    if (MetaMaskOnboarding.isMetaMaskInstalled()) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then(accounts => emitter({event: 'account_loaded', data: accounts}));

      window.ethereum.on('accountsChanged', accounts => emitter({event: 'account_changed', data: accounts}));

      window.ethereum.on('chainChanged', () => emitter({event: 'chain_changed'}));

      window.ethereum.on('connect', (connectInfo) => {
        emitter({event: 'connected_chain', data: connectInfo})
      })
    } else {
      setTimeout(()=>emitter({event: 'metamask_not_installed'}), 0)
    }

    const unsubscribe = () => {
      emitter(END);
    };

    return unsubscribe;
  });
}


export function* handleTransactions(payload, isTimeout: boolean = false) {
  let result = [];
  try {
    for (var item of CURRENCIES) {
      const trs = yield call(metaMaskController.loadTransactions, payload, 
        item.id == ethId ? item.ethPipeContract : item.ethTokenContract, item.id);
      result = result.concat(trs);
    }
  } catch (e) {
    console.log(e);
  }
  yield put(actions.setTransactions(result));
  store.dispatch(mainActions.loadAppParams.request(null));

  if (isTimeout) {
    yield delay(5000);
    yield call(handleTransactions, payload, true);
  }
}

function* sharedSaga() {
  const remoteChannel = yield call(remoteEventChannel);

  while (true) {
    try {
      const payload: any = yield take(remoteChannel);
      if (localStorage.getItem('locked')) {
        store.dispatch(setIsLocked(true));
      }

      switch (payload.event) {
        case 'account_loaded':
          if (payload.data.length === 0) {
            store.dispatch(setIsLoggedIn(false));
            const wasReloaded = localStorage.getItem('wasReloaded');
            if (wasReloaded) {
              metaMaskController.connect();
              localStorage.removeItem('wasReloaded');
            }
            yield put(navigate(ROUTES.MAIN.CONNECT));
          } else {
            store.dispatch(setIsCorrectNetwork(window.ethereum.networkVersion === GOERLI_CHAIN_ID));
            initApp(payload.data[0]);
            yield fork(handleTransactions, payload.data[0], true);
          }

          break;
        
        case 'account_changed':
          if (payload.data.length === 0) {
            store.dispatch(setIsLoggedIn(false));
            yield put(navigate(ROUTES.MAIN.CONNECT));
          } else {
            initApp(payload.data[0]);
            yield fork(handleTransactions, payload.data[0]);
            yield put(navigate(ROUTES.MAIN.BASE));
          }

          break;
        case 'metamask_not_installed':
          store.dispatch(setIsLoggedIn(false));
          store.dispatch(setPopupState({type: 'install', state: true}));
          yield put(navigate(ROUTES.MAIN.CONNECT));

          break;

        case 'chain_changed':
          window.location.reload();
          break;
        default:
          break;
      }
    } catch (err) {
      remoteChannel.close();
    }
  }
}

export default sharedSaga;
