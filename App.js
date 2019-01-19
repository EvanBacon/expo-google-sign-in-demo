import { AppAuth } from 'expo-app-auth';
import * as Constants from 'expo-constants';
import { GoogleSignIn } from 'expo-google-sign-in';
import React from 'react';
import { Image, StyleSheet, Text, View, Platform } from 'react-native';

import GoogleSignInButton from './GoogleSignInButton';

const { OAuthRedirect, URLSchemes } = AppAuth;

const isInClient = Constants.appOwnership === 'expo';
if (isInClient) {
  GoogleSignIn.allowInClient();
}

const clientIdForUseInTheExpoClient =
  '603386649315-vp4revvrcgrcjme51ebuhbkbspl048l9.apps.googleusercontent.com';

/*
 * Redefine this one with your client ID
 *
 * The iOS value is the one that really matters,
 * on Android this does nothing because the client ID
 * is read from the google-services.json.
 */
const yourClientIdForUseInStandalone = Platform.select({
  android:
    '157851373513-mj1d6fddp29k29tn2uiedpke4vhcth13.apps.googleusercontent.com',
  ios:
    '157851373513-bip0o55padtj29hvs1ro22cqoopd5449.apps.googleusercontent.com',
});

const clientId = isInClient
  ? clientIdForUseInTheExpoClient
  : yourClientIdForUseInStandalone;

export default class App extends React.Component {
  state = { user: null };

  async componentDidMount() {
    try {
      await GoogleSignIn.initAsync({
        isOfflineEnabled: true,
        isPromptEnabled: true,
        clientId,
      });
      this._syncUserWithStateAsync();
    } catch ({ message }) {
      alert('GoogleSignIn.initAsync(): ' + message);
    }
  }

  _syncUserWithStateAsync = async () => {
    const user = await GoogleSignIn.signInSilentlyAsync();
    console.log('_syncUserWithStateAsync', { user });
    this.setState({ user });
  };

  signOutAsync = async () => {
    try {
      await GoogleSignIn.signOutAsync();
      this.setState({ user: null });
    } catch ({ message }) {
      alert('signOutAsync: ' + message);
    }
  };

  signInAsync = async () => {
    try {
      await GoogleSignIn.askForPlayServicesAsync();
      const { type, user } = await GoogleSignIn.signInAsync();
      if (type === 'success') {
        this._syncUserWithStateAsync();
      }
    } catch ({ message }) {
      alert('login: Error:' + message);
    }
  };

  _syncUserWithStateAsync = async () => {
    /*
      const user = await GoogleSignIn.signInSilentlyAsync();
      this.setState({ user });
    */

    const data = await GoogleSignIn.signInSilentlyAsync();
    console.log({ data });
    if (data) {
      const photoURL = await GoogleSignIn.getPhotoAsync(256);
      const user = await GoogleSignIn.getCurrentUserAsync();
      this.setState({
        user: {
          ...user.toJSON(),
          photoURL: photoURL || user.photoURL,
        },
      });
    } else {
      this.setState({ user: null });
    }
  };

  get buttonTitle() {
    return this.state.user ? 'Sign-Out of Google' : 'Sign-In with Google';
  }

  render() {
    const scheme = {
      OAuthRedirect,
      URLSchemes,
    };
    const { user } = this.state;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {user && <GoogleProfile {...user} />}
        <GoogleSignInButton onPress={this._toggleAuth}>
          {this.buttonTitle}
        </GoogleSignInButton>
        <Text>AppAuth: {JSON.stringify(scheme, null, 2)}</Text>
      </View>
    );
  }

  _toggleAuth = () => {
    console.log('Toggle', !!this.state.user);
    if (this.state.user) {
      this._signOutAsync();
    } else {
      this._signInAsync();
    }
  };

  _signOutAsync = async () => {
    try {
      // await GoogleSignIn.disconnectAsync();
      await GoogleSignIn.signOutAsync();
      console.log('Log out successful');
    } catch ({ message }) {
      console.error('Demo: Error: logout: ' + message);
    } finally {
      this.setState({ user: null });
    }
  };

  _signInAsync = async () => {
    try {
      await GoogleSignIn.askForPlayServicesAsync();
      const { type, user } = await GoogleSignIn.signInAsync();
      console.log({ type, user });
      if (type === 'success') {
        this._syncUserWithStateAsync();
      }
    } catch ({ message }) {
      console.error('login: Error:' + message);
    }
  };
}

class GoogleProfile extends React.PureComponent {
  render() {
    const { photoURL, displayName, email } = this.props;
    return (
      <View style={styles.container}>
        {photoURL && (
          <Image
            source={{
              uri: photoURL,
            }}
            style={styles.image}
          />
        )}
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.text}>{displayName}</Text>
          <Text style={styles.text}>{email}</Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  image: { width: 128, borderRadius: 64, aspectRatio: 1 },
  text: { color: 'black', fontSize: 16, fontWeight: '600' },
});
