import { apiRequest, getApiBaseUrl, tokenStorage } from './api';

export interface LevelCertificate {
  id: number;
  level: string;
  certificateId: string;
  issuedAt: string;
}

export interface VerifiedLevelCertificate {
  certificateId: string;
  level: string;
  studentName: string;
  issuedAt: string;
  isValid: boolean;
}

/**
 * Service for managing course path completion certificates
 * Note: These are internal platform certificates of achievement, not official language proficiency certificates
 */
export const levelCertificateService = {
  async getMyCertificates(): Promise<LevelCertificate[]> {
    return apiRequest<LevelCertificate[]>('level-certificate/my-certificates');
  },

  /**
   * Verify a course completion certificate by its ID
   * Note: This verifies internal platform achievement only, not official language proficiency
   */
  async verifyCertificate(certificateId: string): Promise<VerifiedLevelCertificate> {
    return apiRequest<VerifiedLevelCertificate>(`level-certificate/verify/${encodeURIComponent(certificateId)}`);
  },

  downloadCertificate(level: string): Promise<void> {
    const token = tokenStorage.get();
    const url = `${getApiBaseUrl()}/api/level-certificate/download/${encodeURIComponent(level)}`;
    return fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải chứng chỉ');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `Course_Path_Completion_Certificate_${level}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      });
  },

  viewCertificate(level: string): void {
    const token = tokenStorage.get();
    const url = `${getApiBaseUrl()}/api/level-certificate/download/${encodeURIComponent(level)}`;
    const authUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
    window.open(authUrl, '_blank');
  },
};
