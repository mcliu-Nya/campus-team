import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toErrorMessage } from '@/lib/errors';
import { dataAdapter } from '@/services/repositories';
import { useAuth } from '@/state/AuthProvider';
import { useToast } from '@/state/ToastProvider';
import type { RecruitmentDetail } from '@/types/models';
import type { RecruitmentWriteRequest } from '@/types/api';
import type { RecruitmentFormValues } from '@/types/forms';
import { RecruitmentForm } from '@/components/recruitment/RecruitmentForm';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews';
import { SignInRequired } from '@/components/ui/SignInRequired';

export default function EditRecruitmentScreen() {
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [detail, setDetail] = useState<RecruitmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDetail(await dataAdapter.recruitments.getDetail(id, user));
    } catch (cause) {
      setError(toErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    // 进入页面即拉取详情，setState 由请求结果驱动
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!user) {
    return <SignInRequired title="登录后编辑招募" description="只有招募发布者可以修改招募内容。" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingState label="正在加载招募信息…" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ErrorState message={error} onRetry={() => void load()} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <EmptyState icon="document-outline" title="招募不存在" description="该招募可能已被删除" />
      </View>
    );
  }

  if (!detail.viewerIsPublisher) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="lock-closed-outline"
          title="只有发布者可以编辑"
          description="你没有该招募的编辑权限"
          actionLabel="返回详情"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const initialValues: RecruitmentFormValues = {
    title: detail.title,
    college: detail.college,
    activityType: detail.activityType,
    neededCount: String(detail.neededCount),
    requirements: detail.requirements,
    contactType: detail.contactType,
    contact: detail.contact ?? '',
    activityUrl: detail.activityUrl,
    extra: detail.extra,
    deadline: detail.deadline,
  };

  const handleSubmit = async (payload: RecruitmentWriteRequest) => {
    setSubmitting(true);
    try {
      await dataAdapter.recruitments.update(detail.id, payload, user);
      showToast('已保存', 'success');
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
        mode="edit"
        initialValues={initialValues}
        submitting={submitting}
        minNeededCount={detail.joinedCount}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
});
