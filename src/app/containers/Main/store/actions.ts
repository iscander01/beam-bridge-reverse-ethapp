import { createAsyncAction, createAction } from 'typesafe-actions';
import { GasPrices } from '../interfaces';

export const setIsLoggedIn = createAction('@@MAIN/SET_IS_LOGGED_IN')<boolean>();
export const setIsLocked = createAction('@@MAIN/SET_IS_LOCKED')<boolean>();
export const setIsTrInProgress = createAction('@@MAIN/SET_IS_TR_IN_PROGRESS')<boolean>();
export const setIsApproveInProgress = createAction('@@MAIN/SET_IS_APPROVE_IN_PROGRESS')<boolean>();

export const setPopupState = createAction('@@MAIN/SET_POPUP_STATE')<{type: string, state: boolean}>();

export const loadRates = createAsyncAction(
    '@@MAIN/GET_RATE',
    '@@MAIN/GET_RATE_SUCCESS',
    '@@MAIN/GET_RATE_FAILURE',
  )<void, any, any>();

  export const loadGasPrices = createAsyncAction(
    '@@MAIN/GET_GAS_PRICES',
    '@@MAIN/GET_GAS_PRICES_SUCCESS',
    '@@MAIN/GET_GAS_PRICES_FAILURE',
  )<void, GasPrices, any>();


