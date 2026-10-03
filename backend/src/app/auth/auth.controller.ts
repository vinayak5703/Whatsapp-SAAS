import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Public } from './auth.decorators';
import { AuthService, AuthSession } from './auth.service';
import { RegisterDto } from './register.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@ApiTags('Authentication')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly whatsapp?: WhatsAppService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in to an existing tenant workspace' })
  async login(
    @Body() body: { email: string; password: string },
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(body.email, body.password);
    this.setRefreshCookie(response, session.refreshToken);
    return {
      success: true,
      data: { accessToken: session.accessToken, user: session.user },
      message: 'Signed in',
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a tenant workspace and its first administrator' })
  async register(
    @Body() input: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.register(input, request);
    this.setRefreshCookie(response, session.refreshToken);
    return {
      success: true,
      data: { accessToken: session.accessToken, user: session.user },
      message: 'Workspace created',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token and issue a new access token' })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('Refresh session is missing');

    const session = await this.auth.refresh(refreshToken);
    this.setRefreshCookie(response, session.refreshToken);
    return {
      success: true,
      data: { accessToken: session.accessToken, user: session.user },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke the current refresh session' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(request.cookies?.['refresh_token']);
    response.clearCookie('refresh_token', { path: '/api/v1/auth' });
    response.clearCookie('refresh_token', { path: '/' });
    return { success: true, data: null, message: 'Signed out' };
  }

  private setRefreshCookie(response: Response, token: string): void {
    const production = this.config.get<string>('NODE_ENV') === 'production';
    response.cookie('refresh_token', token, {
      httpOnly: true,
      secure: production,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}