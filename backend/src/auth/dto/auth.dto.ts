import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto extends LoginDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsString()
  @MinLength(2)
  name: string;
}

export class AuthResponse {
  @ApiProperty()
  access_token: string;

  @ApiProperty({
    example: {
      id: 1,
      email: 'user@example.com',
      name: 'John Doe',
    },
  })
  user: {
    id: number;
    email: string;
    name: string;
  };
} 