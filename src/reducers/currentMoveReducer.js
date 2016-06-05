import { isEqual } from 'lodash';

import initialState from './initialState';
import * as types from '../constants/actionTypes';


function actionsLeft(state = 0, action) {
  if (types.ACTIONS.includes(action.type)) {
    return state - 1;
  } else if (action.type === types.PASS_TURN) {
    return 4;
  } else {
    return state;
  }
}

function availableCities(state = {}, action) {
  switch (action.type) {
    case types.PLAYER_MOVE_SHOW_CITIES:
      return {...action.cities};
    case types.PLAYER_MOVE_TO_CITY:
    case types.PLAYER_MOVE_CANCEL:
      return {};
    default:
      return state;
  }
}

function cardsDrawn(state = [], action) {
  switch (action.type) {
    case types.CARD_DRAW_CARDS_INIT:
      return action.cards.slice();
    case types.CARD_DRAW_CARDS_HANDLE:
      return state.filter((c) => !isEqual(c, action.card));
    default:
      return state;
  }
}

function outbreak(state = {}, action) {
  switch (action.type) {
    case types.OUTBREAK_INIT:
      return {
        ...state,
        color: action.color,
        pending: state.pending.filter((id) => id !== action.cityId)
      };
    case types.OUTBREAK_COMPLETE:
      return {
        ...state,
        color: state.pending.length > 0 ? state.color : null,
        complete: state.pending.length > 0 ? [...state.complete, action.cityId] : []
      };
    case types.OUTBREAK_QUEUE:
      return {
        ...state,
        pending: state.pending.includes(action.cityId) || state.complete.includes(action.cityId)
          ? state.pending
          : [...state.pending, action.cityId]
      };
    default:
      return state;
  }
}

export default function currentMoveReducer(state = initialState.currentMove, action) {
  return {
    ...state,
    availableCities: availableCities(state.availableCities, action),
    actionsLeft: actionsLeft(state.actionsLeft, action),
    cardsDrawn: cardsDrawn(state.cardsDrawn, action),
    outbreak: outbreak(state.outbreak, action)
  };
}
