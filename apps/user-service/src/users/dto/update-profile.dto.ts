import { IsString, IsOptional, MaxLength, IsUrl, IsPhoneNumber, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    firstName?: string;

    @ApiPropertyOptional({ example: 'Doe' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    lastName?: string;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
    @IsOptional()
    @IsUrl()
    avatarUrl?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsOptional()
    @IsPhoneNumber()
    phoneNumber?: string;

    @ApiPropertyOptional({ example: 'USD' })
    @IsOptional()
    @IsString()
    @Length(3, 3)
    currencyPreference?: string;

    @ApiPropertyOptional({ example: 'Software Engineer & FinTech Enthusiast' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;
}
