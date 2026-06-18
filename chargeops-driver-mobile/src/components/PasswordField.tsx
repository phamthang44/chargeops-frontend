import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { colors } from '@/theme';
import { TextField, type TextFieldProps } from './TextField';

/** Password input: a TextField with secureTextEntry and a show/hide eye toggle. */
export function PasswordField(props: Omit<TextFieldProps, 'secureTextEntry' | 'rightAccessory'>) {
  const [hidden, setHidden] = useState(true);

  return (
    <TextField
      {...props}
      secureTextEntry={hidden}
      autoCapitalize="none"
      autoCorrect={false}
      rightAccessory={
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      }
    />
  );
}
