import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('messages')
  @ApiOperation({ summary: 'Search messages across chats' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({ name: 'chatId', description: 'Filter by chatId', required: false })
  @ApiQuery({ name: 'senderId', description: 'Filter by senderId', required: false })
  @ApiQuery({ name: 'limit', description: 'Search results limit', required: false })
  @ApiQuery({ name: 'offset', description: 'Search results offset', required: false })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  async searchMessages(
    @Query('q') query: string,
    @Query('chatId') chatId?: string,
    @Query('senderId') senderId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.searchService.searchMessages(query, {
      chatId,
      senderId,
      limit,
      offset,
    });
  }
}
