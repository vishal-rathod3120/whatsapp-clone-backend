import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('push')
export class PushController {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Get('vapid-public-key')
  getVapidPublicKey() {
    return {
      publicKey: this.configService.get<string>('VAPID_PUBLIC_KEY'),
    };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Req() req: any, @Body() subscription: any) {
    const userId = req.user.id;
    
    // Find or create a web device for this user to store the subscription
    // In a real app, you'd probably link it to the specific device's refresh token
    // For now, we'll upsert based on userId and deviceType WEB
    const device = await this.prisma.device.findFirst({
        where: { userId, deviceType: 'WEB' }
    });

    if (device) {
        await this.prisma.device.update({
            where: { id: device.id },
            data: { pushToken: JSON.stringify(subscription), lastActiveAt: new Date() }
        });
    } else {
        await this.prisma.device.create({
            data: {
                userId,
                deviceType: 'WEB',
                deviceName: 'Web Browser',
                pushToken: JSON.stringify(subscription),
                lastActiveAt: new Date()
            }
        });
    }

    return { success: true };
  }
}
