import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('OpenAI initialized successfully.');
    } else {
      this.logger.warn('OPENAI_API_KEY is not set. Voice transcriptions will be bypassed.');
    }
  }

  /**
   * Transcribes an audio buffer using the Whisper API.
   */
  async transcribeAudio(buffer: Buffer, originalExt: string): Promise<string | null> {
    if (!this.openai) {
      this.logger.debug('OpenAI not configured, skipping transcription.');
      return null;
    }

    // Write buffer to a temp file because OpenAI expects a read stream
    const tempFilePath = path.join(os.tmpdir(), `whisper_${Date.now()}.${originalExt.replace('.', '')}`);
    
    try {
      fs.writeFileSync(tempFilePath, buffer);
      
      const transcription = await this.openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'en', // Can be parameterized or auto-detected
      });

      return transcription.text;
    } catch (error) {
      this.logger.error(`Whisper API Error: ${error.message}`);
      return null;
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
}
