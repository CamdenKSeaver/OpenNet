import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { TextInput, Keyboard } from 'react-native';

const DoneTextInput = forwardRef((props, ref) => {
  const textInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => textInputRef.current?.focus(),
    blur: () => textInputRef.current?.blur(),
  }));

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (props.onSubmitEditing) {
      props.onSubmitEditing();
    }
  };

  return (
    <TextInput
      ref={textInputRef}
      {...props}
      returnKeyType="done"
      enablesReturnKeyAutomatically={true}
      onSubmitEditing={handleSubmit}
      blurOnSubmit={true}
    />
  );
});

DoneTextInput.displayName = 'DoneTextInput';

export default DoneTextInput;