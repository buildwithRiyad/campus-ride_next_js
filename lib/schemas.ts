import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    studentId: z.string().min(1, 'Student ID is required'),
    department: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .min(10, 'Phone must be at least 10 digits')
      .optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const createRideSchema = z.object({
  fromLocation: z.string().min(3, 'From location is required'),

  toLocation: z.string().min(3, 'To location is required'),

  departureTime: z.string().min(
    1,
    'Departure time is required'
  ),

  vehicleType: z.enum([
    'CAR',
    'BIKE',
    'RICKSHAW',
    'CNG',
  ]),

  availableSeats: z
    .number()
    .min(1, 'Must have at least 1 seat')
    .max(8, 'Max 8 seats'),

  pricePerSeat: z
    .number()
    .min(1, 'Price must be greater than 0'),

  note: z.string().optional(),
});

export const bookRideSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateRideInput = z.infer<typeof createRideSchema>;
export type BookRideInput = z.infer<typeof bookRideSchema>;