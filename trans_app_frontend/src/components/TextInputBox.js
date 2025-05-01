import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { colors } from '../utils/colors';

const TextInputBox = ({ value, onChangeText }) => {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="Nhập hoặc chỉnh sửa văn bản tiếng Việt"
      multiline
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderColor: colors.borderGray,
    borderWidth: 1,
    height: 100,
    marginVertical: 10,
    padding: 10,
    width: '100%',
  },
});

export { TextInputBox };