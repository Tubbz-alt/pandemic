import React, { PropTypes } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { isEmpty, partial } from 'lodash';

import TopBar from './TopBar';
import Map from './Map';
import TeamPanel from '../components/TeamPanel';
import BottomBar from './BottomBar';
import CardLayer from './CardLayer';
import DiscardPanel from './DiscardPanel';
import DefeatMessage from '../components/DefeatMessage';
import IntroDialog from '../components/IntroDialog';
import * as mapActions from '../actions/mapActions';
import * as globalActions from '../actions/globalActions';
import { getPlayers, getCurrentCityId, getPlayerCityId, getPlayerHand,
  getInitialInfectedCity, getDefeatMessage } from '../selectors';


class Game extends React.Component {
  static propTypes = {
    currentMove: PropTypes.object.isRequired,
    players: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
        cityId: PropTypes.string.isRequired
      })
    ),
    currentPlayerId: PropTypes.string.isRequired,
    currentCityId: PropTypes.string.isRequired,
    getPlayerCityId: PropTypes.func.isRequired,
    getPlayerHand: PropTypes.func.isRequired,
    status: PropTypes.oneOf(['prepare', 'playing', 'defeat', 'victory']).isRequired,
    initialInfectedCity: PropTypes.string,
    defeatMessage: PropTypes.string,
    actions: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
    router: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);

    ['onCityClicked', 'onCityDoubleClicked', 'onIntroClosed'].forEach((meth) => {
      this[meth] = this[meth].bind(this);
    });
  }

  state = {
    showIntro: true,
    initialInfectedCity: null
  }

  componentDidMount() {
    this.props.router.setRouteLeaveHook(this.props.route, () =>
      'Do you want to leave the game?');
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.initialInfectedCity !== nextProps.initialInfectedCity) {
      this.setState({ initialInfectedCity: nextProps.initialInfectedCity });
    }
  }

  doMovePlayer(destinationId, source) {
    const { playerToMove } = this.props.currentMove;
    let playerId, originId;
    if (playerToMove) {
      playerId = playerToMove;
      originId = this.props.getPlayerCityId(playerId);
    } else {
      playerId = this.props.currentPlayerId;
      originId = this.props.currentCityId;
    }

    this.refs.map.getWrappedInstance().transitionPlayerMove(playerId, destinationId, true);
    this.props.actions.moveToCity(
      playerId,
      originId,
      destinationId,
      source);
  }

  onIntroClosed() {
    this.setState({ showIntro: false });
    this.props.actions.dealCardsInit();
  }

  onCityClicked(id) {
    const { availableCities, airlift, govGrantCities } = this.props.currentMove;
    if (!isEmpty(availableCities)) {
      const { source } = availableCities[id];
      this.doMovePlayer(id, source);
    } else if (!isEmpty(govGrantCities)) {
      this.props.actions.govGrantBuildStation(id);
    } else if (!isEmpty(airlift) && !isEmpty(airlift.cities)) {
      this.refs.map.getWrappedInstance().transitionPlayerMove(airlift.playerId, id);
      this.props.actions.airliftMoveToCity(airlift.playerId, id);
    }
  }

  onCityDoubleClicked(id) {
    this.doMovePlayer(id, 'drive');
  }

  render() {
    const { status, defeatMessage } = this.props;
    return (
      <div className="game">
        <DiscardPanel />
        <TopBar />
        {status !== 'prepare' &&
          <TeamPanel
            players={this.props.players}
            getPlayerHand={this.props.getPlayerHand}
            currentPlayerId={this.props.currentPlayerId} />
        }
        {status !== 'prepare' &&
          <BottomBar />
        }
        <Map
          ref="map"
          onCityClicked={this.onCityClicked}
          onCityDoubleClicked={this.onCityDoubleClicked}
          initialInfectedCity={this.state.initialInfectedCity} />
        <CardLayer
          map={this.refs.map}
          initialInfectedCity={this.state.initialInfectedCity} />
        {status === 'prepare' && this.state.showIntro &&
          <IntroDialog
            players={this.props.players}
            onClosed={this.onIntroClosed} />
        }
        {status === 'defeat' &&
          <div className="defeat-overlay" />
        }
        {status === 'defeat' &&
          <DefeatMessage message={defeatMessage} />
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  currentMove: state.currentMove,
  players: getPlayers(state),
  currentPlayerId: state.currentMove.player,
  currentCityId: getCurrentCityId(state),
  getPlayerCityId: partial(getPlayerCityId, state),
  getPlayerHand: partial(getPlayerHand, state),
  status: state.status,
  initialInfectedCity: getInitialInfectedCity(state),
  defeatMessage: getDefeatMessage(state)
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({ ...mapActions, ...globalActions }, dispatch)
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Game));
