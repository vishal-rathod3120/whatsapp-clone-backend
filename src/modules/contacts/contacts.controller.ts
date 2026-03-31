import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ContactDiscoveryService } from './contact-discovery.service';
import { DiscoverContactsDto } from './dto/discover-contacts.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactDiscoveryService: ContactDiscoveryService) {}

  @Post('discover')
  @ApiOperation({ summary: 'Discover registered contacts from phone hashes' })
  async discoverContacts(
    @Req() req: any,
    @Body() dto: DiscoverContactsDto,
  ) {
    return this.contactDiscoveryService.discoverContacts(
      req.user.sub,
      dto.hashes,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get saved contacts list' })
  async getContacts(@Req() req: any) {
    return this.contactDiscoveryService.getUserContacts(req.user.sub);
  }

  @Delete(':contactId')
  @ApiOperation({ summary: 'Remove a contact' })
  async removeContact(
    @Req() req: any,
    @Param('contactId') contactId: string,
  ) {
    return this.contactDiscoveryService.removeContact(req.user.sub, contactId);
  }
}
