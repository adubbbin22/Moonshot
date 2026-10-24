import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { TakeProfileView } from '@/components/TakeProfileView';
import { Button, Screen } from '@/components/ui';
import { useTakeProfile } from '@/hooks/useTakeProfile';
import { spacing } from '@/theme/tokens';

export default function WelcomeProfileScreen() {
  const profile = useTakeProfile();
  return (
    <Screen
      title="Your take profile"
      subtitle="Built only from your calls. It decides which questions you see next."
      edges={['top', 'bottom']}
      footer={
        <View style={styles.footer}>
          <Button label="See ways to express your takes" onPress={() => router.push('/welcome/terms')} />
          <Button label="Make more calls" variant="secondary" onPress={() => router.push('/welcome/calls')} />
        </View>
      }>
      <TakeProfileView profile={profile} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.sm },
});
