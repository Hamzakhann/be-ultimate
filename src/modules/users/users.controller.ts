import { Controller, Post, Body, UseGuards, Get, Request, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { WalletService } from './wallet.service';
import { CreateUserDto } from './dto/create-user.dto';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly walletService: WalletService
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    async register(@Body() createUserDto: CreateUserDto) {
        console.log('Received registration data:', createUserDto);
        return this.usersService.create(createUserDto);
    }


    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @Get('profile')
    getProfile(@Request() req) {
        return this.usersService.findByEmail(req.user.email); // Returns the decoded JWT payload
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Transfer funds to another user' })
    @Post('transfer')
    async transferFunds(
        @Request() req,
        @Body() transferDto: TransferDto,
        @Ip() ip: string
    ) {
        return this.walletService.transferFunds(
            req.user.userId, // Matches payload.sub mapping in JwtStrategy
            transferDto.toUserId,
            transferDto.amount,
            ip
        );
    }
}