import React from 'react';
import { TextInput, StyleSheet } from 'react-native';

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
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginVertical: 10,
    padding: 10,
  },
});

export default TextInputBox;