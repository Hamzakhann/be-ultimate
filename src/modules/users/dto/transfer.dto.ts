import { IsString, IsNumber, IsPositive, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
    @ApiProperty({ description: 'The UUID of the receiver user' })
    @IsString()
    @IsNotEmpty()
    toUserId: string;

    @ApiProperty({ description: 'The amount to transfer', example: 100 })
    @IsNumber()
    @IsPositive()
    amount: number;
}
