"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, Modal, Radio, Stack, Text, Textarea } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { AlreadyHandledError } from "@/lib/api";
import { useApproveSpot, useRejectSpot } from "@/lib/queries";
import { REJECT_REASONS, RejectReason, Spot, isPending } from "@/types/spot";

/** 승인/반려 처리 버튼 + 확인 모달 (기획서 5장) */
export function SpotActions({ spot }: { spot: Spot }) {
  const router = useRouter();
  const [approveOpened, approveModal] = useDisclosure(false);
  const [rejectOpened, rejectModal] = useDisclosure(false);

  const [reason, setReason] = useState<RejectReason | null>(null);
  const [detail, setDetail] = useState("");

  const approve = useApproveSpot(spot.id);
  const reject = useRejectSpot(spot.id);

  // 이미 처리된 건은 더 처리할 게 없다
  if (!isPending(spot.status)) return null;

  function finish(message: string) {
    notifications.show({ color: "green", message });
    router.push("/");
  }

  function fail(error: Error) {
    // 다른 담당자가 먼저 처리한 경우 — 안내하고 최신 목록으로 돌려보낸다 (기획서 7.2)
    if (error instanceof AlreadyHandledError) {
      approveModal.close();
      closeRejectModal();
      notifications.show({
        color: "yellow",
        title: "이미 처리된 건입니다",
        message: "다른 담당자가 먼저 처리했습니다. 목록을 새로고침합니다.",
      });
      router.push("/");
      return;
    }

    // 네트워크 실패 — 모달을 열어둔 채로 두어 그대로 재시도할 수 있게 한다
    notifications.show({
      color: "red",
      title: "처리에 실패했습니다",
      message: `${error.message} 잠시 후 다시 시도해주세요.`,
    });
  }

  function closeRejectModal() {
    rejectModal.close();
    setReason(null);
    setDetail("");
  }

  function submitApprove() {
    approve.mutate(undefined, {
      onSuccess: () => {
        approveModal.close();
        finish(`'${spot.name}' 승인 처리했습니다.`);
      },
      onError: fail,
    });
  }

  function submitReject() {
    if (!reason) return;
    reject.mutate(
      { reason, detail: detail.trim() || undefined },
      {
        onSuccess: () => {
          closeRejectModal();
          finish(`'${spot.name}' 반려 처리했습니다.`);
        },
        onError: fail,
      }
    );
  }

  // "기타"는 추가 입력이 있어야 확정할 수 있다 (기획서 5장)
  const canSubmitReject =
    reason !== null && (reason !== RejectReason.ETC || detail.trim().length > 0);

  return (
    <>
      <Group gap="sm">
        <Button color="red" variant="light" onClick={rejectModal.open}>
          반려
        </Button>
        <Button color="green" onClick={approveModal.open}>
          승인
        </Button>
      </Group>

      <Modal
        opened={approveOpened}
        onClose={approveModal.close}
        title="승인 처리"
        centered
      >
        <Stack>
          <Text size="sm">
            &apos;{spot.name}&apos; 스팟을 승인하시겠습니까?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={approveModal.close}>
              취소
            </Button>
            <Button
              color="green"
              loading={approve.isPending}
              onClick={submitApprove}
            >
              승인 확정
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={rejectOpened}
        onClose={closeRejectModal}
        title="반려 처리"
        centered
      >
        <Stack>
          <Radio.Group
            value={reason ?? ""}
            onChange={(value) => setReason(value as RejectReason)}
            label="반려 사유"
            withAsterisk
          >
            <Stack gap="xs" mt="xs">
              {REJECT_REASONS.map((r) => (
                <Radio key={r} value={r} label={r} />
              ))}
            </Stack>
          </Radio.Group>

          {reason === RejectReason.ETC && (
            <Textarea
              label="사유 입력"
              placeholder="반려 사유를 입력해주세요"
              withAsterisk
              autosize
              minRows={3}
              value={detail}
              onChange={(e) => setDetail(e.currentTarget.value)}
            />
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={closeRejectModal}>
              취소
            </Button>
            <Button
              color="red"
              disabled={!canSubmitReject}
              loading={reject.isPending}
              onClick={submitReject}
            >
              반려 확정
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
