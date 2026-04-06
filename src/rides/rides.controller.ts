/**
 * Rides Controller
 *
 * REST API for Ride Management.
 * Exposes lifecycle actions (Create, Cancel, Start, Complete).
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RidesService } from './rides.service';
import { CreateRideDto } from './dto/create-ride.dto';
import { EstimateRideDto } from './dto/estimate-ride.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';
import { RideHistoryQueryDto } from './dto/ride-history-query.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CollectPaymentDto } from './dto/collect-payment.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { TriggerSosDto } from './dto/trigger-sos.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../common/constants/user-roles.constant';
import { User } from '../users/schemas/user.schema';

@ApiTags('Rides')
@ApiBearerAuth('JWT')
@Controller('rides')
@UseGuards(RolesGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) { }

  @Post('estimate')
  @ApiOperation({ summary: 'Estimate ride fare and distance' })
  @ApiResponse({ status: 200, description: 'Estimation result' })
  @ApiBearerAuth('JWT') // Optional if public? But usually authenticated. Controller has @UseGuards(RolesGuard) class level.
  // Wait, if RolesGuard blocks, we need to allow any authenticated user? 
  // The class has @UseGuards(RolesGuard), but no @Roles() here means it might depend on implementation of RolesGuard.
  // Usually RolesGuard checks if @Roles is present. If not, it might allow or deny.
  // Assuming default allow for authenticated users if no role specified, or we add @Roles(UserRole.RIDER, UserRole.DRIVER).
  // Let's assume Rider initiates it.
  @Roles(UserRole.RIDER)
  async estimate(@Body() estimateDto: EstimateRideDto) {
    return this.ridesService.estimateRide(estimateDto);
  }

  @Post()
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Request a new ride (Rider only)' })
  @ApiResponse({ status: 201, description: 'Ride created successfully' })
  async create(
    @CurrentUser('id') riderId: string,
    @Body() createDto: CreateRideDto,
  ) {
    return this.ridesService.createRequest(riderId, createDto);
  }

  @Patch(':id/request-bidding')
  @Roles(UserRole.RIDER)
  @ApiOperation({
    summary: 'Open ride for bidding (Transition to BIDDING status)',
  })
  async requestBidding(
    @Param('id') rideId: string,
    @CurrentUser('id') riderId: string,
  ) {
    return this.ridesService.requestBidding(rideId, riderId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get current active ride (if any)' })
  async getActiveRide(
    @CurrentUser() user: User,
  ) {
    return this.ridesService.findActiveRide((user as any).id, user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Get ride history (Paginated)' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: RideHistoryQueryDto,
  ) {
    // CurrentUser decorator returns the User document, so we access properties directly
    // Assuming the interface has ._id or .id. If it's the mongoose document, .id works.
    // Casting to any to avoid strict type issues with 'user' param vs string id
    return this.ridesService.findAll((user as any).id, user.role, query);
  }

  // --- Driver Actions ---

  @Patch(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept a ride request' })
  async accept(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.ridesService.acceptRide(rideId, driverId);
  }

  @Patch(':id/arrived')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Mark driver as arrived at pickup' })
  async arrived(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
    @Body() body?: { location?: { lat: number; lng: number } },
  ) {
    return this.ridesService.driverArrived(rideId, driverId, body?.location);
  }

  @Patch(':id/verify-otp')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Verify OTP and start the ride' })
  async verifyOtpAndStart(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    return this.ridesService.verifyOtpAndStart(rideId, driverId, verifyOtpDto.otp);
  }

  @Patch(':id/collect-payment')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Collect payment from rider' })
  async collectPayment(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
    @Body() paymentDto: CollectPaymentDto,
  ) {
    return this.ridesService.collectPayment(
      rideId,
      driverId,
      paymentDto.paymentMethod,
      paymentDto.amount,
    );
  }

  @Patch(':id/complete')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Complete the ride' })
  async complete(
    @Param('id') rideId: string,
    @CurrentUser('id') driverId: string,
    @Body() body?: { dropOtp?: string },
  ) {
    return this.ridesService.completeRide(rideId, driverId, body?.dropOtp);
  }

  // --- Common Actions ---

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel ride' })
  async cancel(
    @Param('id') rideId: string,
    @CurrentUser() user: User,
    @Body() cancelDto: CancelRideDto,
  ) {
    return this.ridesService.cancelRide(
      rideId,
      (user as any).id,
      user.role,
      cancelDto.reason,
    );
  }

  @Get(':id/contact')
  @ApiOperation({ summary: 'Get contact info of other party (Call Feature)' })
  async getContact(
    @Param('id') rideId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ridesService.getRideContact(rideId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride details with driver/rider info' })
  async getRideDetails(
    @Param('id') rideId: string,
  ) {
    return this.ridesService.getRideDetails(rideId);
  }

  @Post(':id/review')
  @Roles(UserRole.RIDER)
  @ApiOperation({ summary: 'Submit driver review after ride completion' })
  async submitReview(
    @Param('id') rideId: string,
    @CurrentUser('id') riderId: string,
    @Body() reviewDto: SubmitReviewDto,
  ) {
    return this.ridesService.submitReview(
      rideId,
      riderId,
      reviewDto.rating,
      reviewDto.review,
    );
  }

  // --- SOS / Emergency ---

  @Post(':id/sos')
  @ApiOperation({ summary: 'Trigger SOS emergency alert during a ride' })
  @ApiResponse({ status: 201, description: 'SOS alert triggered, returns session info + emergency contacts' })
  async triggerSOS(
    @Param('id') rideId: string,
    @CurrentUser() user: User,
    @Body() sosDto: TriggerSosDto,
  ) {
    return this.ridesService.triggerSOS(
      rideId,
      (user as any).id,
      user.role,
      sosDto.latitude && sosDto.longitude
        ? { latitude: sosDto.latitude, longitude: sosDto.longitude }
        : undefined,
    );
  }

  @Post(':id/sos/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update SOS live location (sent every few seconds)' })
  async updateSOSLocation(
    @Param('id') rideId: string,
    @CurrentUser('id') userId: string,
    @Body() body: TriggerSosDto,
  ) {
    return this.ridesService.updateSOSLocation(
      rideId,
      userId,
      { latitude: body.latitude!, longitude: body.longitude! },
    );
  }

  @Get(':id/sos/track/:sessionId')
  @Public()
  @ApiOperation({ summary: 'Get SOS live tracking data (public - no auth required)' })
  @ApiResponse({ status: 200, description: 'Returns live location data for emergency contacts' })
  async getSOSTracking(
    @Param('id') rideId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.ridesService.getSOSTracking(rideId, sessionId);
  }

  @Get(':id/sos/view/:sessionId')
  @Public()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Get SOS live tracking HTML page (public - no auth required)' })
  async getSOSTrackingView(
    @Param('id') rideId: string,
    @Param('sessionId') sessionId: string,
  ) {
    // Verify session exists
    const data = await this.ridesService.getSOSTracking(rideId, sessionId);
    const jsonUrl = `/api/v1/rides/${rideId}/sos/track/${sessionId}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>RIDEXA SOS Live Tracking</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
        <style>
          body { margin: 0; padding: 0; background: #1a1a1a; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          #map { height: 100vh; width: 100%; }
          .overlay {
            position: absolute; bottom: 20px; left: 20px; right: 20px;
            background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px);
            padding: 20px; border-radius: 16px; border: 1px solid rgba(255, 68, 68, 0.3);
            z-index: 1000; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; }
          .title { font-size: 18px; font-weight: 800; color: #ff4444; letter-spacing: 1px; display: flex; align-items: center; gap: 10px; }
          .status-badge { background: #ff4444; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; animation: pulse 2s infinite; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #ccc; }
          .label { color: #888; font-size: 12px; }
          .value { font-weight: 600; }
          @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
          
          /* Custom marker pulse */
          .sos-marker-icon {
            background: rgba(255, 68, 68, 0.3);
            border-radius: 50%;
            display: flex; justify-content: center; align-items: center;
          }
          .sos-marker-dot {
            width: 16px; height: 16px; background: #ff4444; border-radius: 50%;
            border: 2px solid white; box-shadow: 0 0 10px #ff4444;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="overlay">
          <div class="header">
            <div class="title">🚨 SOS ACTIVE</div>
            <div class="status-badge">LIVE</div>
          </div>
          <div class="info-row">
            <div><div class="label">RIDER</div><div class="value">${data.riderName}</div></div>
            <div style="text-align: right"><div class="label">ACTIVATED AT</div><div class="value" id="time">Just now</div></div>
          </div>
          <div class="info-row" style="margin-top: 15px; border-top: 1px solid #333; padding-top: 15px;">
             <div><div class="label">LAST UPDATE</div><div class="value" id="last-update">Waiting...</div></div>
          </div>
        </div>

        <script>
          // Premium Dark Map Style
          const map = L.map('map', { zoomControl: false }).setView([${data.currentLocation?.latitude || 0}, ${data.currentLocation?.longitude || 0}], 15);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
          }).addTo(map);

          // Custom Marker Icon
          const sosIcon = L.divIcon({
            className: 'sos-marker-icon',
            html: '<div class="sos-marker-dot"></div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          let marker = L.marker([${data.currentLocation?.latitude || 0}, ${data.currentLocation?.longitude || 0}], {icon: sosIcon}).addTo(map);
          let pathLine = L.polyline([], {color: '#ff4444', weight: 4, opacity: 0.7}).addTo(map);

          // Update Logic
          async function updateLocation() {
            try {
              const res = await fetch('${jsonUrl}');
              const data = await res.json();
              
              if (data.active === false) {
                 document.querySelector('.status-badge').style.background = '#444';
                 document.querySelector('.status-badge').innerText = 'RESOLVED';
                 document.querySelector('.status-badge').style.animation = 'none';
                 return;
              }

              if (data.currentLocation) {
                const { latitude, longitude } = data.currentLocation;
                const newLatLng = [latitude, longitude];
                
                marker.setLatLng(newLatLng);
                map.panTo(newLatLng);
                
                // Update timestamp
                const date = new Date();
                document.getElementById('last-update').innerText = date.toLocaleTimeString();
                
                // Update history line
                if (data.locationHistory && data.locationHistory.length > 0) {
                   const latlngs = data.locationHistory.map(h => [h.latitude, h.longitude]);
                   pathLine.setLatLngs(latlngs);
                }
              }
            } catch (e) {
              console.error(e);
            }
          }

          // Initial load
          const historyCoords = ${JSON.stringify((data.locationHistory || []).map(h => [h.latitude, h.longitude]))};
          if (historyCoords.length > 0) {
             pathLine.setLatLngs(historyCoords);
          }
          
          // Poll every 3 seconds
          setInterval(updateLocation, 3000);
          updateLocation();
        </script>
      </body>
      </html>
    `;
  }

  @Post(':id/sos/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate SOS emergency session' })
  async deactivateSOS(
    @Param('id') rideId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ridesService.deactivateSOS(rideId, userId);
  }
}
