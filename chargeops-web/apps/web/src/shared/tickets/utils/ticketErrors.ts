import type { TFunction } from 'i18next';

export interface TicketErrorMeta {
  title: string;
  message: string;
  code?: string;
  isConflict?: boolean;
  isAccessDenied?: boolean;
  isNotFound?: boolean;
}

/**
 * Maps backend ticket errors (ApiError, code, messageKey, or default backend string)
 * into localized, user-friendly title and message.
 */
export function getTicketErrorMeta(error: any, t: TFunction): TicketErrorMeta {
  const code = (error?.code || '').toUpperCase();
  const messageKey = error?.messageKey || '';
  const rawMsg = String(error?.message || error || '').trim();

  // 1. ACCESS DENIED
  if (
    code === 'TKT_ACCESS_DENIED' ||
    messageKey === 'error.ticket.accessDenied' ||
    rawMsg.includes('You do not have access to this support ticket') ||
    rawMsg.includes('accessDenied') ||
    error?.status === 403
  ) {
    return {
      title: t('errors.accessDeniedTitle', 'Từ chối quyền truy cập'),
      message: t('errors.accessDenied', 'Bạn không có quyền truy cập hoặc thực hiện thao tác trên phiếu hỗ trợ này.'),
      code: 'TKT_ACCESS_DENIED',
      isAccessDenied: true,
    };
  }

  // 1b. CLAIM REQUIRED
  if (
    code === 'TKT_CLAIM_REQUIRED' ||
    code === 'CLAIM_REQUIRED' ||
    messageKey === 'error.ticket.claimRequired' ||
    rawMsg.includes('Claim this support ticket before sending a reply') ||
    rawMsg.includes('claimRequired')
  ) {
    return {
      title: t('errors.claimRequiredTitle', 'Cần nhận xử lý phiếu'),
      message: t('errors.claimRequired', 'Bạn cần nhận xử lý phiếu này trước khi gửi tin nhắn phản hồi.'),
      code: 'TKT_CLAIM_REQUIRED',
    };
  }

  // 1c. NOT CURRENT HANDLER
  if (
    code === 'TKT_NOT_CURRENT_HANDLER' ||
    code === 'NOT_CURRENT_HANDLER' ||
    messageKey === 'error.ticket.notCurrentHandler' ||
    rawMsg.includes('assigned to another handler') ||
    rawMsg.includes('only the current handler can reply') ||
    rawMsg.includes('notCurrentHandler')
  ) {
    return {
      title: t('errors.notCurrentHandlerTitle', 'Không phải người phụ trách'),
      message: t('errors.notCurrentHandler', 'Phiếu hỗ trợ này đang được phân công cho nhân sự khác; chỉ người phụ trách hiện tại mới có quyền phản hồi.'),
      code: 'TKT_NOT_CURRENT_HANDLER',
    };
  }

  // 2. NOT FOUND
  if (
    code === 'TKT_NOT_FOUND' ||
    messageKey === 'error.ticket.notFound' ||
    rawMsg.includes('Support ticket was not found') ||
    error?.status === 404
  ) {
    return {
      title: t('errors.notFoundTitle', 'Không tìm thấy phiếu hỗ trợ'),
      message: t('errors.notFound', 'Phiếu hỗ trợ được yêu cầu không tồn tại hoặc đã bị xóa khỏi hệ thống.'),
      code: 'TKT_NOT_FOUND',
      isNotFound: true,
    };
  }

  // 3. VERSION CONFLICT
  if (
    code === 'TKT_VERSION_CONFLICT' ||
    messageKey === 'error.ticket.versionConflict' ||
    rawMsg.includes('Support ticket data changed') ||
    rawMsg.includes('VERSION') ||
    rawMsg.includes('409')
  ) {
    return {
      title: t('errors.versionConflictTitle', 'Dữ liệu đã thay đổi'),
      message: t('errors.versionConflict', 'Dữ liệu phiếu đã được cập nhật bởi một thao tác khác. Vui lòng làm mới trang.'),
      code: 'TKT_VERSION_CONFLICT',
      isConflict: true,
    };
  }

  // 4. CLOSED
  if (
    code === 'TKT_CLOSED' ||
    messageKey === 'error.ticket.closed' ||
    rawMsg.includes('A closed support ticket cannot receive new messages')
  ) {
    return {
      title: t('errors.closedTitle', 'Phiếu đã đóng'),
      message: t('errors.closed', 'Phiếu hỗ trợ này đã hoàn tất và đóng, không thể gửi thêm phản hồi.'),
      code: 'TKT_CLOSED',
    };
  }

  // 5. STATE CONFLICT
  if (
    code === 'TKT_STATE_CONFLICT' ||
    messageKey === 'error.ticket.stateConflict' ||
    rawMsg.includes('cannot be changed in its current state')
  ) {
    return {
      title: t('errors.stateConflictTitle', 'Trạng thái không hợp lệ'),
      message: t('errors.stateConflict', 'Trạng thái hiện tại của phiếu không cho phép thực hiện thao tác này.'),
      code: 'TKT_STATE_CONFLICT',
    };
  }

  // 6. INVALID SCOPE
  if (
    code === 'TKT_INVALID_SCOPE' ||
    messageKey === 'error.ticket.invalidScope' ||
    rawMsg.includes('booking or station context is invalid')
  ) {
    return {
      title: t('errors.invalidScopeTitle', 'Bối cảnh không hợp lệ'),
      message: t('errors.invalidScope', 'Đơn sạc hoặc trạm liên kết không phù hợp với phạm vi phiếu hỗ trợ này.'),
      code: 'TKT_INVALID_SCOPE',
    };
  }

  // 7. ASSIGNMENT INVALID
  if (
    code === 'TKT_ASSIGNMENT_INVALID' ||
    messageKey === 'error.ticket.assignmentInvalid' ||
    rawMsg.includes('selected handler cannot process')
  ) {
    return {
      title: t('errors.assignmentInvalidTitle', 'Phân công không hợp lệ'),
      message: t('errors.assignmentInvalid', 'Nhân viên được chọn không hợp lệ hoặc không có quyền phụ trách trạm này.'),
      code: 'TKT_ASSIGNMENT_INVALID',
    };
  }

  // 8. FINDING INVALID
  if (
    code === 'TKT_FINDING_INVALID' ||
    messageKey === 'error.ticket.findingInvalid' ||
    rawMsg.includes('station-failure finding is invalid')
  ) {
    return {
      title: t('errors.findingInvalidTitle', 'Kết luận không hợp lệ'),
      message: t('errors.findingInvalid', 'Kết luận sự cố kỹ thuật không phù hợp với phiếu hỗ trợ này.'),
      code: 'TKT_FINDING_INVALID',
    };
  }

  // 9. CODE CONFLICT
  if (
    code === 'TKT_CODE_CONFLICT' ||
    messageKey === 'error.ticket.codeConflict' ||
    rawMsg.includes('ticket code already exists')
  ) {
    return {
      title: t('errors.codeConflictTitle', 'Mã phiếu đã tồn tại'),
      message: t('errors.codeConflict', 'Mã phiếu hỗ trợ đã tồn tại trên hệ thống. Vui lòng thử lại.'),
      code: 'TKT_CODE_CONFLICT',
    };
  }

  // Fallback
  return {
    title: t('errors.genericTitle', 'Thao tác không thành công'),
    message: rawMsg || t('errors.generic', 'Đã xảy ra sự cố khi xử lý yêu cầu. Vui lòng thử lại sau.'),
    code: code || undefined,
  };
}
