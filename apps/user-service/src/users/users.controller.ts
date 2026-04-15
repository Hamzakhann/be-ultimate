import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard, CurrentUser } from '@app/common';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Kafka listener for user.created event
     */
    @EventPattern('user.created')
    async handleUserCreated(@Payload() data: { userId: string, email: string }) {
        await this.usersService.handleUserCreated(data);
    }

    /**
     * GET /api/v1/users/me
     * Returns the profile of the currently authenticated user
     */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@CurrentUser() user: any) {
        // user.userId comes from the JwtStrategy
        return this.usersService.getProfile(user.userId);
    }

    /**
     * PATCH /api/v1/users/profile
     * Updates profile metadata
     */
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Patch('profile')
    @ApiOperation({ summary: 'Update user profile' })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.userId, updateProfileDto);
    }
}
