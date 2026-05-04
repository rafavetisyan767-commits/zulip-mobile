/* @flow strict-local */

import React, { PureComponent } from 'react';
import type { ComponentType } from 'react';
import { Linking } from 'react-native';

import type {
  ServerSettings,
} from '../api/settings/getServerSettings';
import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import type { GlobalDispatch } from '../types';
import { IconPrivate } from '../common/Icons';
import { connectGlobal } from '../react-redux';
import styles from '../styles';
import Centerer from '../common/Centerer';
import Screen from '../common/Screen';
import ZulipButton from '../common/ZulipButton';
import RealmInfo from './RealmInfo';
import * as webAuth from './webAuth';
import { loginSuccess } from '../actions';

type OuterProps = $ReadOnly<{|
  navigation: AppNavigationProp<'auth'>,
  route: RouteProp<
    'auth',
    {|
      serverSettings: ServerSettings,
    |},
  >,
|}>;

type SelectorProps = $ReadOnly<{||}>;

type Props = $ReadOnly<{|
  ...OuterProps,
  dispatch: GlobalDispatch,
  ...SelectorProps,
|}>;

let otp = '';

type LinkingEvent = {
  url: string,
  ...
};

class AuthScreenInner extends PureComponent<Props> {
  componentDidMount() {
    Linking.addEventListener('url', this.endWebAuth);
    Linking.getInitialURL().then((initialUrl: ?string) => {
      if (initialUrl !== null && initialUrl !== undefined) {
        this.endWebAuth({ url: initialUrl });
      }
    });
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.endWebAuth);
  }

  endWebAuth = (event: LinkingEvent) => {
    webAuth.closeBrowser();
    const { dispatch } = this.props;
    const { serverSettings } = this.props.route.params;
    const auth = webAuth.authFromCallbackUrl(event.url, otp, serverSettings.realm_uri);
    if (auth) {
      dispatch(loginSuccess(auth.realm, auth.email, auth.apiKey));
    }
  };

  handlePassword = () => {
    const { serverSettings } = this.props.route.params;
    const realm = serverSettings.realm_uri;
    this.props.navigation.push('password-auth', {
      realm,
      requireEmailFormat: serverSettings.require_email_format_usernames,
    });
  };

  render() {
    const { serverSettings } = this.props.route.params;

    return (
      <Screen title="Log in" centerContent padding shouldShowLoadingBanner={false}>
        <Centerer>
          <RealmInfo
            name={serverSettings.realm_name}
            iconUrl={new URL(serverSettings.realm_icon, serverSettings.realm_uri).toString()}
          />
          <ZulipButton
            style={styles.halfMarginTop}
            secondary
            text="Sign in with password"
            Icon={IconPrivate}
            onPress={() => this.handlePassword()}
          />
        </Centerer>
      </Screen>
    );
  }
}

const AuthScreen: ComponentType<OuterProps> = connectGlobal<{||}, _, _>()(AuthScreenInner);

export default AuthScreen;
