import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toErrorMessage } from '@/lib/errors';
import { dataAdapter } from '@/services/repositories';
import { useAuth } from '@/state/AuthProvider';
import { useToast } from '@/state/ToastProvider';
import type { RecruitmentWriteRequest } from '@/types/api';
import type { User } from '@/types/models';
import { EMPTY_RECRUITMENT_FORM, type RecruitmentFormValues } from '@/types/forms';
import { RecruitmentForm } from '@/components/recruitment/RecruitmentForm';
import { SignInRequired } from '@/components/ui/SignInRequired';

export default function NewRecruitmentScreen() {
  const { user } = useAuth();

  if (!user) {
    return (
      <SignInRequired
        title="登录后发布招募"
        description="发布招募需要使用真实身份，方便同学与你联系。"
      />
    );
  }

  return <NewRecruitmentContent user={user} />;
}

function NewRecruitmentContent({ user }: { user: User }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const initialValues: RecruitmentFormValues = {
    ...EMPTY_RECRUITMENT_FORM,
    college: user.college,
  };

  const handleSubmit = async (payload: RecruitmentWriteRequest) => {
    setSubmitting(true);
    try {
      await dataAdapter.recruitments.create(payload, user);
      showToast('发布成功', 'success');
      router.back();
    } catch (cause) {
      showToast(toErrorMessage(cause), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <RecruitmentForm
        mode="create"
        initialValues={initialValues}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
