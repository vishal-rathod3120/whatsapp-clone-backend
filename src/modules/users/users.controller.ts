import { Controller, Get, Patch, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getMe() {
    // User ID should come from auth guard
    return { message: 'Get current user' };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateMe(@Body() dto: UpdateProfileDto) {
    // User ID should come from auth guard
    return { message: 'Update profile' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('block/:id')
  @ApiOperation({ summary: 'Block a user' })
  async blockUser(@Param('id') id: string) {
    // User ID should come from auth guard
    return { message: 'Block user' };
  }

  @Delete('block/:id')
  @ApiOperation({ summary: 'Unblock a user' })
  async unblockUser(@Param('id') id: string) {
    // User ID should come from auth guard
    return { message: 'Unblock user' };
  }
}
