import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';

interface FormData {
  name: string;
  description?: string;
}

interface MetadataFormProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
  disabled?: boolean;
}

export default function MetadataForm({ control, errors, disabled }: MetadataFormProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Name <Text style={styles.requiredIndicator}>*</Text>
        </Text>
        <Controller
          name="name"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.textInput, errors.name && styles.inputError]}
              placeholder="Enter video name"
              placeholderTextColor="#9ca3af"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              editable={!disabled}
              maxLength={100}
            />
          )}
        />
        {errors.name && <Text style={styles.errorMessage}>{errors.name.message}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <Controller
          name="description"
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.textInput, styles.textArea, errors.description && styles.inputError]}
              placeholder="Enter description (optional)"
              placeholderTextColor="#9ca3af"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!disabled}
              maxLength={500}
            />
          )}
        />
        {errors.description && (
          <Text style={styles.errorMessage}>{errors.description.message}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requiredIndicator: {
    color: '#ef4444',
  },
  textInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorMessage: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});
