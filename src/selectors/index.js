import _ from 'lodash';


export function getAvailableCities(state) {
  const player = getCurrentPlayer(state);
  const cityId = getCurrentCityId(state);

  const direct = reduceWithAttrs(getCitiesInHand(state, player.hand), { source: 'direct' });
  const neighbors = reduceWithAttrs(getNeighborCities(state, cityId), { source: 'drive' });
  const charters = isCharterAvailable(state) ? reduceWithAttrs(state.cities, { source: 'charter' }) : {};
  const stations = isStationAvailable(state) ? reduceWithAttrs(getStationCities(state), { source: 'shuttle' }) : {};
  const cities = _.assign({}, charters, direct, neighbors, stations);
  delete cities[cityId];
  return cities;
}

export function getCurrentPlayer(state) {
  return state.players[0];
}

export function getCurrentCityId(state) {
  return state.map.playersLocations[0];
}

function getNeighborCities(state, cityId) {
  const cities = [];
  state.map.matrix[cityId].forEach((item, i) => {
    if (item === 1) {
      cities.push(state.cities[i]);
    }
  });
  return cities;
}

function getStationCities(state) {
  const cityIds = _.chain(state.map.locations).map((loc, id) => {
    if (loc.station) {
      return id;
    }
  }).compact().value();
  return cityIds.map((c) => state.cities[c]);
}

function getCitiesInHand(state, hand) {
  return _.chain(hand)
    .filter({ cardType: 'city' })
    .map((c) => state.cities[c.id])
    .value();
}

function isCharterAvailable(state) {
  const hand = getCurrentPlayer(state).hand;
  return !!_.find(hand, { cardType: 'city', id: getCurrentCityId(state) });
}

function isStationAvailable(state) {
  const cityId = getCurrentCityId(state);
  return state.map.locations[cityId].station;
}

function reduceWithAttrs(array, attrs = {}) {
  return _.reduce(array, (acc, c) => { acc[c.id] = {...c, ...attrs }; return acc; }, {});
}