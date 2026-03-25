import { Controller, Post, Get, UseInterceptors, UploadedFile, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MediaService } from './media.service';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload media file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @CurrentUser() user: JwtPayload
  ) {
    try {
      const storageKey = file.filename;
      const attachment = await this.mediaService.createAttachment(
        user.sub,
        file,
        storageKey,
      );

      const signedUrl = await this.mediaService.getSignedUrl(storageKey, 900);

      return {
        attachmentId: attachment.id,
        url: signedUrl,
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (err: any) {
      console.error('UPLOAD ERROR:', err);
      throw new HttpException(
        { message: 'Upload failed', error: err.message, stack: err.stack },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('download/:attachmentId')
  @ApiOperation({ summary: 'Get signed download URL for media' })
  async getDownloadUrl(
    @Param('attachmentId') attachmentId: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    const attachment = await this.mediaService.getAttachmentById(attachmentId);
    if (!attachment) {
      return { error: 'Attachment not found' };
    }

    const signedUrl = await this.mediaService.getSignedUrl(
      attachment.storageKey,
      expiresIn || 900,
    );

    return {
      attachmentId: attachment.id,
      url: signedUrl,
      expiresIn: expiresIn || 900,
    };
  }
}
