import type { TFunction } from 'i18next';

export interface PaymentErrorInfo {
  code?: string;
  messageKey?: string;
  message?: string;
  errorMessage?: string;
  userMessage?: string;
}

/**
 * Maps payment and system errors from backend to user-friendly localized messages.
 * Never leaks raw technical paths, stack traces, or UUIDs to end-users.
 */
export function paymentErrorMessage(t: TFunction, error: unknown): string {
  if (!error) {
    return t('payment.errors.GENERIC', 'Thanh toán không thành công. Vui lòng thử lại sau.');
  }

  let code: string | undefined;
  let messageKey: string | undefined;
  let rawMessage: string | undefined;

  if (typeof error === 'object' && error !== null) {
    const errObj = (error as any).error || error;
    code = errObj.code || errObj.errorCode;
    messageKey = errObj.messageKey;
    rawMessage = errObj.errorMessage || errObj.message || errObj.userMessage;

    // Support HTTP status codes if code is not explicitly provided
    if (!code && typeof (error as any).status === 'number') {
      const httpStatus = (error as any).status;
      if (httpStatus === 404) code = 'SYS_404';
      else if (httpStatus === 401) code = 'AUTH_001';
      else if (httpStatus === 403) code = 'AUTH_003';
      else if (httpStatus === 409) code = 'SYS_409';
      else if (httpStatus === 503) code = 'PAY_CHECKOUT_UNAVAILABLE';
      else if (httpStatus >= 500) code = 'SYS_001';
    }
  } else if (typeof error === 'string') {
    code = error;
  }

  // 1. Check direct messageKey if present in locales
  if (messageKey) {
    const directKey = `payment.errors.${messageKey}`;
    const directTranslated = t(directKey);
    if (directTranslated && directTranslated !== directKey) {
      return directTranslated;
    }
    const rawKeyTranslated = t(messageKey);
    if (rawKeyTranslated && rawKeyTranslated !== messageKey) {
      return rawKeyTranslated;
    }
  }

  // 2. Check by error code (e.g. payment.errors.SYS_003)
  if (code) {
    const codeKey = `payment.errors.${code}`;
    const codeTranslated = t(codeKey);
    if (codeTranslated && codeTranslated !== codeKey) {
      return codeTranslated;
    }

    // Well-known fallback translations (when key missing in locales)
    switch (code) {
      case 'SYS_001':
      case 'SYS_002':
        return t('payment.errors.SYS_001', 'Hệ thống máy chủ tạm thời gián đoạn. Vui lòng thử lại sau ít phút.');
      case 'SYS_003':
      case 'INVALID_REQUEST':
        return t('payment.errors.SYS_003', 'Dữ liệu yêu cầu thanh toán không hợp lệ. Vui lòng thử lại.');
      case 'SYS_004':
        return t('payment.errors.SYS_004', 'Thao tác không được hỗ trợ trên thiết bị này.');
      case 'SYS_005':
        return t('payment.errors.SYS_005', 'Lỗi xác thực liên kết. Vui lòng đăng nhập lại.');
      case 'SYS_006':
      case 'SYS_409':
      case 'RESOURCE_CONFLICT':
        return t('payment.errors.SYS_409', 'Dữ liệu đã thay đổi do thao tác khác. Vui lòng làm mới màn hình.');
      case 'SYS_404':
      case 'RESOURCE_NOT_FOUND':
        return t('payment.errors.SYS_404', 'Dịch vụ thanh toán chưa sẵn sàng hoặc không tìm thấy đơn đặt chỗ.');
      case 'PAY_CHECKOUT_UNAVAILABLE':
        return t('payment.errors.PAY_CHECKOUT_UNAVAILABLE', 'Cổng thanh toán tạm thời gián đoạn. Vui lòng thử lại sau.');
      case 'PAY_NOT_FOUND':
        return t('payment.errors.PAY_NOT_FOUND', 'Không tìm thấy thông tin phiên thanh toán của đơn đặt này.');
      case 'PAY_STATE_CONFLICT':
        return t('payment.errors.PAY_STATE_CONFLICT', 'Trạng thái thanh toán không hợp lệ hoặc giao dịch đã được xử lý thành công.');
      case 'PAY_METHOD_INVALID':
        return t('payment.errors.PAY_METHOD_INVALID', 'Phương thức thanh toán đã chọn hiện không khả dụng.');
      case 'PAY_AMOUNT_INVALID':
        return t('payment.errors.PAY_AMOUNT_INVALID', 'Số tiền thanh toán không khớp với hóa đơn đặt chỗ.');
      case 'PAY_CHECKOUT_REQUIRED':
        return t('payment.errors.PAY_CHECKOUT_REQUIRED', 'Chưa khởi tạo phiên thanh toán cho đơn hàng này.');
      case 'PAY_RECEIPT_INVALID':
        return t('payment.errors.PAY_RECEIPT_INVALID', 'Biên lai thanh toán không hợp lệ hoặc bị từ chối.');
      case 'PAY_SIMULATION_REQUEST_INVALID':
        return t('payment.errors.PAY_SIMULATION_REQUEST_INVALID', 'Dữ liệu thanh toán mô phỏng không hợp lệ. Vui lòng thử lại.');
      case 'PAY_RECONCILIATION_REQUIRED':
        return t('payment.errors.PAY_RECONCILIATION_REQUIRED', 'Giao dịch đang chờ ngân hàng đối soát. Vui lòng đợi trong giây lát.');
      case 'BKG_HOLD_EXPIRED':
      case 'HOLD_EXPIRED':
        return t('payment.errors.BKG_HOLD_EXPIRED', 'Thời gian giữ chỗ (10 phút) đã hết hạn. Đơn đặt chỗ đã tự động hủy.');
      case 'BKG_SLOT_UNAVAILABLE':
        return t('payment.errors.BKG_SLOT_UNAVAILABLE', 'Khung giờ bạn chọn hiện không còn khả dụng.');
      case 'AUTH_001':
      case 'UNAUTHORIZED':
        return t('payment.errors.AUTH_001', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      case 'AUTH_003':
      case 'ACCESS_DENIED':
        return t('payment.errors.AUTH_003', 'Bạn không có quyền thực hiện giao dịch này.');
      case 'NETWORK_ERROR':
        return t('payment.errors.NETWORK_ERROR', 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
      case 'TIMEOUT':
        return t('payment.errors.TIMEOUT', 'Hết thời gian chờ phản hồi từ cổng thanh toán. Vui lòng thử lại.');
      case 'CANCELLED':
        return t('payment.errors.CANCELLED', 'Giao dịch đã được hủy.');
    }
  }

  // 3. Fallback to rawMessage ONLY if it is safe, polite and non-technical
  const isTechnical =
    !rawMessage ||
    rawMessage.includes('/api/') ||
    rawMessage.includes('Exception') ||
    rawMessage.includes('traceId') ||
    rawMessage.includes('SYS_') ||
    rawMessage.includes('HTTP_') ||
    rawMessage.includes('JSON') ||
    rawMessage.includes('org.springframework') ||
    rawMessage.includes('com.thang.') ||
    rawMessage.includes('Cannot find') ||
    rawMessage.includes('Invalid request format') ||
    rawMessage.includes('NoResourceFoundException') ||
    rawMessage.includes('NullPointer');

  if (!isTechnical && rawMessage) {
    return rawMessage;
  }

  return t('payment.errors.GENERIC', 'Thanh toán không thành công. Vui lòng thử lại sau.');
}
