import { BadRequestException } from '@nestjs/common';
import { extname } from 'node:path';
import { AttachmentKind } from './entities/reservation-attachment.entity';

export interface UploadedReservationFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type ReservationFiles = Partial<
  Record<AttachmentKind, UploadedReservationFile[]>
>;
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const formats: Record<string, { mime: string; signature: number[] }> = {
  '.pdf': {
    mime: 'application/pdf',
    signature: [0x25, 0x50, 0x44, 0x46, 0x2d],
  },
  '.png': {
    mime: 'image/png',
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  '.jpg': { mime: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  '.jpeg': { mime: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  '.doc': {
    mime: 'application/msword',
    signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  },
  '.ppt': {
    mime: 'application/vnd.ms-powerpoint',
    signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  },
  '.docx': {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
  '.pptx': {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
};

export function validateFiles(files: ReservationFiles) {
  if (!files?.oficio?.length) {
    throw new BadRequestException('O ofício é obrigatório.');
  }
  return Object.entries(files).flatMap(([kind, uploads]) => {
    if (
      !Object.values(AttachmentKind).includes(kind as AttachmentKind) ||
      uploads.length !== 1
    ) {
      throw new BadRequestException('Anexos inválidos.');
    }
    return uploads.map((file: UploadedReservationFile) => {
      const format = formats[extname(file.originalname).toLowerCase()];
      if (
        !format ||
        !file.buffer?.length ||
        file.size > MAX_ATTACHMENT_SIZE ||
        file.size !== file.buffer.length ||
        !format.signature.every((byte, i) => file.buffer[i] === byte)
      ) {
        throw new BadRequestException(
          'Anexo inválido. Envie PDF, Word, PowerPoint, JPG ou PNG de até 10 MB.',
        );
      }
      return {
        kind: kind as AttachmentKind,
        originalName: file.originalname
          .replace(/[^\p{L}\p{N}._ -]/gu, '_')
          .slice(-255),
        mimeType: format.mime,
        size: file.size,
        content: file.buffer,
      };
    });
  });
}
