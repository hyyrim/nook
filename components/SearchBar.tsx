import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Radius } from '@/constants';
import { Ionicons } from '@expo/vector-icons';

type SearchBarProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
};

export function SearchBar({ placeholder = '저장한 콘텐츠 찾기', value, onChangeText, editable = false }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={15} color={Colors.tertiary} />
      {editable ? (
        <>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={Colors.tertiary}
            value={value}
            onChangeText={onChangeText}
          />
          {value && value.length > 0 && (
            <Pressable onPress={() => onChangeText?.('')}>
              <Ionicons name="close" size={16} color={Colors.tertiary} />
            </Pressable>
          )}
        </>
      ) : (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: Colors.primary,
  },
  placeholder: {
    fontSize: 14.5,
    color: Colors.tertiary,
  },
});
