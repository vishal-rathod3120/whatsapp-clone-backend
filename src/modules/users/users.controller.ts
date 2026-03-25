import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Body() dto: UpdateProfileDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by phone or name' })
  async searchUsers(@Query('q') query: string, @CurrentUser() user: JwtPayload) {
    if (!query) return [];
    return this.usersService.searchUsers(query, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('block/:id')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.blockUser(user.sub, id);
  }

  @Delete('block/:id')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.unblockUser(user.sub, id);
  }
}
