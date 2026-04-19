import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { EventPattern, Payload, MessagePattern } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard, CurrentUser } from '@app/common';
import { Transport } from '@nestjs/microservices';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Kafka listener for user.created event
     */
    @EventPattern('user.created', Transport.KAFKA)
    async handleUserCreated(@Payload() data: { userId: string, email: string }) {
        await this.usersService.handleUserCreated(data);
    }

    /**
     * GET /api/v1/users/me
     * Returns the profile of the currently authenticated user
     */
    @MessagePattern({ cmd: 'get_profile' }, Transport.TCP)
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@CurrentUser() user: any, @Payload() data?: any) {
        // When called via MessagePattern, user might be in data or user decorator
        const userId = user?.userId || data?.userId;
        return this.usersService.getProfile(userId);
    }

    /**
     * PATCH /api/v1/users/profile
     * Updates profile metadata
     */
    @MessagePattern({ cmd: 'update_profile' }, Transport.TCP)
    @Patch('profile')
    @ApiOperation({ summary: 'Update user profile' })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateProfileDto: UpdateProfileDto,
        @Payload() data?: any,
    ) {
        const userId = user?.userId || data?.userId;
        const dto = data?.dto || updateProfileDto;
        return this.usersService.updateProfile(userId, dto);
    }
}
