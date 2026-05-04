/* @flow strict-local */
import React, { useCallback } from 'react';
import type { Node } from 'react';
import { Keyboard, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import type { RouteProp } from '../react-navigation';
import type { AppNavigationProp } from '../nav/AppNavigator';
import Screen from '../common/Screen';
import ZulipButton from '../common/ZulipButton';
import { tryParseUrl } from '../utils/url';
import { fetchServerSettings } from '../message/fetchActions';
import { createStyleSheet } from '../styles';
import { showErrorAlert } from '../utils/info';
import { TranslationContext } from '../boot/TranslationProvider';
import type { LocalizableText } from '../types';
import { getGlobalSettings } from '../directSelectors';
import { useGlobalSelector } from '../react-redux';

type Props = $ReadOnly<{|
  navigation: AppNavigationProp<'realm-input'>,
  route: RouteProp<'realm-input', {| initial: boolean | void |}>,
|}>;

enum ValidationError {
  Empty = 0,
  InvalidUrl = 1,
  NoUseEmail = 2,
  UnsupportedSchemeZulip = 3,
  UnsupportedSchemeOther = 4,
}

function validationErrorMsg(validationError: ValidationError): LocalizableText {
  switch (validationError) {
    case ValidationError.Empty:
      return 'Please enter a URL.';
    case ValidationError.InvalidUrl:
      return 'Please enter a valid URL.';
    case ValidationError.NoUseEmail:
      return 'Please enter the server URL, not your email.';
    case ValidationError.UnsupportedSchemeZulip:
    case ValidationError.UnsupportedSchemeOther:
      return 'The server URL must start with http:// or https://.';
  }
}

type MaybeParsedInput =
  | {| +valid: true, value: URL |}
  | {| +valid: false, error: ValidationError |};

const tryParseInput = (realmInputValue: string): MaybeParsedInput => {
  const trimmedInputValue = realmInputValue.trim();
  if (trimmedInputValue.length === 0) {
    return { valid: false, error: ValidationError.Empty };
  }
  let url = tryParseUrl(trimmedInputValue);
  if (!/^https?:\/\//.test(trimmedInputValue)) {
    if (url && url.protocol === 'zulip:') {
      return { valid: false, error: ValidationError.UnsupportedSchemeZulip };
    } else if (url && url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: ValidationError.UnsupportedSchemeOther };
    }
    url = tryParseUrl(`https://${trimmedInputValue}`);
  }
  if (!url) {
    return { valid: false, error: ValidationError.InvalidUrl };
  }
  if (url.username !== '') {
    return { valid: false, error: ValidationError.NoUseEmail };
  }
  return { valid: true, value: url };
};

export default function RealmInputScreen(props: Props): Node {
  const { navigation, route } = props;
  const globalSettings = useGlobalSelector(getGlobalSettings);
  const _ = React.useContext(TranslationContext);
  const [progress, setProgress] = React.useState(false);
  const [realmInputValue] = React.useState('https://raffaello.zulipchat.com');
  const maybeParsedInput = tryParseInput(realmInputValue);
  const textInputRef = React.useRef<React$ElementRef<typeof TextInput> | null>(null);

  const tryRealm = React.useCallback(async () => {
    if (!maybeParsedInput.valid) {
      showErrorAlert(_('Invalid input'), _(validationErrorMsg(maybeParsedInput.error)));
      return;
    }
    setProgress(true);
    const result = await fetchServerSettings(maybeParsedInput.value);
    setProgress(false);
    if (result.type === 'error') {
      showErrorAlert(
        _(result.title),
        _(result.message),
        result.learnMoreButton && {
          url: result.learnMoreButton.url,
          text: result.learnMoreButton.text != null ? _(result.learnMoreButton.text) : undefined,
          globalSettings,
        },
      );
      return;
    }
    const serverSettings = result.value;
    navigation.push('auth', { serverSettings });
    Keyboard.dismiss();
  }, [navigation, maybeParsedInput, globalSettings, _]);

  const styles = React.useMemo(
    () =>
      createStyleSheet({
        button: { marginTop: 8 },
      }),
    [],
  );

  return (
    <Screen
      title="Welcome"
      canGoBack={!route.params.initial}
      padding
      centerContent
      keyboardShouldPersistTaps="always"
      shouldShowLoadingBanner={false}
    >
      <ZulipButton
        style={styles.button}
        text="Enter"
        progress={progress}
        onPress={tryRealm}
        isPressHandledWhenDisabled
        disabled={!maybeParsedInput.valid}
      />
    </Screen>
  );
}
