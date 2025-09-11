// src/components/DoneTextInput.js - Enhanced with iOS Done Button
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { 
  TextInput, 
  Keyboard, 
  Platform, 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  InputAccessoryView 
} from 'react-native';

const DoneTextInput = forwardRef((props, ref) => {
  const textInputRef = useRef(null);
  const accessoryViewID = `DoneButton_${Math.random().toString(36).substr(2, 9)}`;

  useImperativeHandle(ref, () => ({
    focus: () => textInputRef.current?.focus(),
    blur: () => textInputRef.current?.blur(),
    isFocused: () => textInputRef.current?.isFocused(),
  }));

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (props.onSubmitEditing) {
      props.onSubmitEditing();
    }
  };

  const handleDone = () => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
    if (props.onDone) {
      props.onDone();
    }
  };

  // Extract our custom props and pass the rest to TextInput
  const { onDone, ...textInputProps } = props;

  return (
    <>
      <TextInput
        ref={textInputRef}
        {...textInputProps}
        returnKeyType="done"
        enablesReturnKeyAutomatically={true}
        onSubmitEditing={handleSubmit}
        blurOnSubmit={true}
        inputAccessoryViewID={Platform.OS === 'ios' ? accessoryViewID : undefined}
      />
      
      {/* iOS Keyboard Done Button */}
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={accessoryViewID}>
          <View style={styles.keyboardAccessory}>
            <TouchableOpacity
              style={styles.keyboardDoneButton}
              onPress={handleDone}
            >
              <Text style={styles.keyboardDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  keyboardAccessory: {
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  keyboardDoneButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  keyboardDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

DoneTextInput.displayName = 'DoneTextInput';

export default DoneTextInput;