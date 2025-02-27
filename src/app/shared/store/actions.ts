import { createAction, createAsyncAction } from 'typesafe-actions';
import { SharedActionTypes } from './constants';

export const navigate = createAction(SharedActionTypes.NAVIGATE)<string>();
export const setError = createAction(SharedActionTypes.SET_ERROR)<string | null>();

export const loadTransactions = createAsyncAction(
  '@@SHARED/LOAD_TRANSACTION',
  '@@SHARED/LOAD_TRANSACTION_SUCCESS',
  '@@SHARED/LOAD_TRANSACTION_FAILURE',
)<{
  address: string;
  chain: number;
}, any, any>();