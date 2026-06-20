import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-node-nestjs',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './nestjs.html',
  styleUrl: './nestjs.scss'
})
export class NodeNestjs {
  quickRef: QuickRefItem[] = [
    { name: '@Module()', type: 'decorator', desc: 'Defines a module: imports, providers, controllers, exports. Root = AppModule.' },
    { name: '@Controller(prefix)', type: 'decorator', desc: 'Marks a class as a route controller. Methods decorated with @Get/@Post etc.' },
    { name: '@Injectable()', type: 'decorator', desc: 'Marks a class as a DI provider. Singleton by default in its module scope.' },
    { name: '@Get/@Post/@Put/@Delete', type: 'decorator', desc: 'Route decorators on controller methods. Accept optional path string.' },
    { name: '@Body()/@Param()/@Query()', type: 'decorator', desc: 'Parameter decorators: extract request body, URL param, query string.' },
    { name: 'Guards', type: 'keyword', desc: 'Determine if a request should proceed. Return true/false or throw UnauthorizedException.' },
    { name: 'Interceptors', type: 'keyword', desc: 'Wrap request/response flow. Use for logging, caching, response transformation.' },
    { name: 'Pipes', type: 'keyword', desc: 'Transform and validate incoming data. ValidationPipe uses class-validator under the hood.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Modules, Controllers, and Services',
      points: [
        'NestJS is a TypeScript-first framework built on Express (or Fastify) with Angular-inspired architecture. Applications are organised into modules — each module encapsulates a domain feature (UsersModule, AuthModule, ProductsModule).',
        '@Module() declares what a module contains: imports (other modules), providers (services/repositories), controllers (HTTP handlers), and exports (providers available to importing modules). This enforces explicit dependency graphs.',
        'Controllers handle HTTP routing. A @Controller("users") class with @Get(":id") handles GET /users/:id. Parameters are extracted with decorators: @Param("id"), @Body(), @Query(). Controllers should be thin — delegate business logic to Services.',
        'Services (@Injectable()) contain business logic. They are registered as providers and injected into controllers via constructor injection. NestJS\'s IoC container manages instantiation — services are singletons by default within their module scope.',
      ]
    },
    {
      heading: 'Dependency Injection and Providers',
      points: [
        'NestJS\'s IoC container manages provider lifecycles. When a module bootstraps, NestJS instantiates all providers and resolves their dependencies recursively. Circular dependencies are detected at startup — fail fast, not at runtime.',
        'Provider scopes: DEFAULT (singleton per module, shared across requests), REQUEST (new instance per HTTP request — useful for per-request context), TRANSIENT (new instance each time injected). Most providers should be DEFAULT.',
        'Custom providers: useValue (inject a constant/config object), useFactory (async factory function — useful for async initialization like DB connections), useClass (swap implementation based on env), useExisting (alias one provider to another).',
        'forwardRef() resolves circular dependencies: if ServiceA depends on ServiceB and vice versa. Use it sparingly — circular dependencies usually indicate a design issue. Consider extracting shared logic to a third service.',
      ]
    },
    {
      heading: 'Guards, Interceptors, Pipes, and Filters',
      points: [
        'Guards implement CanActivate: return true to allow, false to deny (throws ForbiddenException). Use for authentication checks. Execution order: global guards → controller guards → method guards. @UseGuards(AuthGuard, RolesGuard) applies multiple guards.',
        'Interceptors implement NestInterceptor: wrap the route handler with an Observable chain. Use for: logging (before and after), response transformation (wrap in { data: ... }), caching (return cached result before hitting handler), timeout handling.',
        'Pipes validate and transform request data. ValidationPipe with class-validator DTOs rejects invalid input automatically: class CreateUserDto { @IsEmail() email: string; @MinLength(8) password: string; }. Apply globally with app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })).',
        'Exception Filters catch thrown exceptions and format the response. Built-in: HttpException, NotFoundException, BadRequestException. Custom: @Catch(HttpException) class HttpExceptionFilter implements ExceptionFilter. Apply globally for consistent error format across all routes.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Module, Controller, Service',
      language: 'typescript',
      code: `// users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService }    from './users.service';
import { TypeOrmModule }   from '@nestjs/typeorm';
import { User }            from './entities/user.entity';

@Module({
  imports:     [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers:   [UsersService],
  exports:     [UsersService],   // so AuthModule can inject UsersService
})
export class UsersModule {}

// users/users.controller.ts
import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard }  from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService }  from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() { return this.usersService.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}

// users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { User }             from './entities/user.entity';
import { CreateUserDto }    from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  findAll()             { return this.userRepo.find(); }
  async findOne(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException(\`User \${id} not found\`);
    return user;
  }
  create(dto: CreateUserDto) { return this.userRepo.save(this.userRepo.create(dto)); }
}`
    },
    {
      label: 'Guards, Pipes, and Interceptors',
      language: 'typescript',
      code: `// DTOs with class-validator
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['user', 'admin'])
  role: string;
}

// JWT Auth Guard
import { AuthGuard } from '@nestjs/passport';
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Roles Guard
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector }                                 from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('roles', [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!required) return true;
    const { user } = ctx.switchToHttp().getRequest();
    return required.includes(user.role);
  }
}

// Logging Interceptor
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap }                                            from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const req    = ctx.switchToHttp().getRequest();
    const start  = Date.now();
    return next.handle().pipe(
      tap(() => console.log(\`\${req.method} \${req.url} — \${Date.now() - start}ms\`))
    );
  }
}

// Bootstrap with global configuration
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(3000);
}
bootstrap();`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Putting business logic in controllers',
      wrong: `@Get(':id')
async findUser(@Param('id') id: string) {
  const user = await this.db.users.findById(id); // DB call in controller
  if (!user) return { error: 'Not found' };      // error handling in controller
  return user;
}`,
      right: `@Get(':id')
findUser(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.findOne(id); // delegate entirely
}
// UsersService throws NotFoundException — NestJS converts it to 404`,
      explanation: 'Controllers should only route and delegate — no business logic, no DB calls, no error construction. Services handle logic and throw NestJS built-in exceptions. This keeps controllers thin and services testable in isolation.'
    },
    {
      title: 'Not applying ValidationPipe globally (or at all)',
      wrong: `// No ValidationPipe — @Body() accepts any shape
@Post()
create(@Body() dto: CreateUserDto) { return this.service.create(dto); }
// dto could have missing fields, wrong types — no runtime validation`,
      right: `// In main.ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));`,
      explanation: 'TypeScript types are erased at runtime. Without ValidationPipe, NestJS sends any JSON body to the DTO class without validation. whitelist:true strips extra fields; forbidNonWhitelisted:true rejects requests with unexpected fields; transform:true converts strings to numbers where typed.'
    },
    {
      title: 'Exporting providers unnecessarily (or not exporting when needed)',
      wrong: `// AuthModule needs UsersService but UsersModule doesn't export it
@Module({ providers: [UsersService] }) // not exported
export class UsersModule {}
// AuthModule: Cannot find UsersService in providers`,
      right: `@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
// Now: @Module({ imports: [UsersModule] }) in AuthModule gives access to UsersService`,
      explanation: 'Providers are private to their module by default. To share a service with another module, add it to exports. The consuming module must import the providing module — not re-declare the provider (that creates a new singleton).'
    },
    {
      title: 'Using REQUEST scope unnecessarily',
      wrong: `@Injectable({ scope: Scope.REQUEST }) // new instance per request
export class UsersService { ... } // slows down startup, increases memory`,
      right: `@Injectable() // DEFAULT scope — singleton shared across requests
export class UsersService { ... }`,
      explanation: 'REQUEST scope creates a new service instance per HTTP request and propagates scope to all its dependencies. This increases instantiation overhead and memory usage. Only use REQUEST scope for services that genuinely need per-request state (e.g. storing the current user).'
    },
  ];

  challenge: Challenge = {
    title: 'Products CRUD Module',
    language: 'typescript',
    description: 'Build a complete NestJS feature module for Products with: CreateProductDto (name: required string, price: required positive number, category: enum ["electronics","clothing","food"]), ProductsService with findAll/findOne/create/remove methods throwing NotFoundException for missing items, ProductsController wiring all operations, and ProductsModule. Use in-memory array storage (no DB needed).',
    hints: [
      'Use @IsString(), @IsPositive(), @IsEnum() from class-validator',
      'NotFoundException from @nestjs/common for missing items',
      '@Delete(":id") with @Param("id") for the remove route',
    ],
    starterCode: `// dto/create-product.dto.ts
import { IsString, IsPositive, IsEnum } from 'class-validator';

export class CreateProductDto {
  // TODO: add decorated properties
}

// products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private products = [];
  private nextId = 1;
  // TODO: findAll, findOne, create, remove
}

// products.controller.ts
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  // TODO: GET /, GET /:id, POST /, DELETE /:id
}`,
    solution: `// dto/create-product.dto.ts
import { IsString, IsPositive, IsEnum } from 'class-validator';
export class CreateProductDto {
  @IsString() name: string;
  @IsPositive() price: number;
  @IsEnum(['electronics', 'clothing', 'food']) category: string;
}

// products.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  private products: any[] = [];
  private nextId = 1;

  findAll() { return this.products; }

  findOne(id: number) {
    const p = this.products.find(p => p.id === id);
    if (!p) throw new NotFoundException(\`Product \${id} not found\`);
    return p;
  }

  create(dto: CreateProductDto) {
    const product = { id: this.nextId++, ...dto };
    this.products.push(product);
    return product;
  }

  remove(id: number) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) throw new NotFoundException(\`Product \${id} not found\`);
    return this.products.splice(idx, 1)[0];
  }
}

// products.controller.ts
import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get() findAll() { return this.productsService.findAll(); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.productsService.findOne(id); }
  @Post() create(@Body() dto: CreateProductDto) { return this.productsService.create(dto); }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.productsService.remove(id); }
}

// products.module.ts
import { Module } from '@nestjs/common';
@Module({ controllers: [ProductsController], providers: [ProductsService] })
export class ProductsModule {}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the purpose of @Module exports in NestJS?', options: ['To expose HTTP routes publicly', 'To make providers available to other modules that import this module', 'To register global providers', 'To declare external dependencies'], answer: 1, explanation: 'Providers are private to their module by default. Adding a provider to exports makes it available for injection in any module that imports the containing module. Without export, other modules cannot inject the service.' },
    { q: 'When should you use REQUEST scope for a NestJS provider?', options: ['Always — it provides better isolation', 'Only when the provider needs per-request state, like storing the current authenticated user', 'For database repositories', 'For services that call external APIs'], answer: 1, explanation: 'REQUEST scope creates a new instance per HTTP request and propagates to all transitive dependencies. This has overhead. Use it only when the service genuinely needs per-request state. DEFAULT (singleton) is correct for stateless services.' },
    { q: 'What does whitelist: true do in ValidationPipe?', options: ['Allows only whitelisted IP addresses', 'Strips any properties from the DTO that are not decorated with validation decorators', 'Validates only the first request per session', 'Enables HTML whitelist sanitization'], answer: 1, explanation: 'whitelist: true removes any extra properties from the incoming request body that are not explicitly declared and decorated in the DTO. This prevents property injection attacks where clients send unexpected fields.' },
    { q: 'What is the execution order of NestJS execution pipeline?', options: ['Controller → Guard → Pipe → Interceptor → Handler', 'Middleware → Guard → Interceptor → Pipe → Handler → Interceptor (after) → Filter', 'Guard → Middleware → Pipe → Handler', 'Pipe → Guard → Handler → Interceptor'], answer: 1, explanation: 'NestJS execution order: Middleware → Guards → Interceptors (before) → Pipes → Handler → Interceptors (after) → Exception Filters. Guards determine access. Pipes transform/validate. Interceptors wrap around the handler. Filters catch exceptions.' },
  ];

  qna: QnaItem[] = [
    { q: 'How does NestJS dependency injection compare to Angular DI?', a: 'Both use the same IoC container concept: providers registered in a module, resolved via constructor injection. Key differences: NestJS DI is module-scoped (providers in one module are not visible to another unless exported/imported), while Angular has a hierarchical injector tree. NestJS also supports async providers (useFactory with async functions for DB connections), which Angular does not support natively. The token-based registration system and @Inject() decorator work the same way.' },
    { q: 'How do I implement a custom authentication Guard with JWT?', a: 'Use @nestjs/passport with passport-jwt: (1) Install @nestjs/passport, passport, passport-jwt. (2) Create a JwtStrategy extending PassportStrategy(Strategy) — validate() receives the JWT payload and returns the user or throws UnauthorizedException. (3) Register in AuthModule providers. (4) Create JwtAuthGuard extending AuthGuard("jwt"). (5) Apply with @UseGuards(JwtAuthGuard) on controller or method. The guard automatically calls the strategy\'s validate() and attaches the result to req.user.' },
    { q: 'What is the difference between Interceptors and Middleware in NestJS?', a: 'Middleware runs at the HTTP level before routing — it has no NestJS context (cannot inject services, cannot access route metadata). Interceptors are NestJS-aware: they run after guards but before/after the handler, can inject services, can access ExecutionContext (route metadata, class, method). Use middleware for HTTP-level operations (CORS, request logging, body parsing). Use interceptors for NestJS-level concerns (response transformation, caching with injected cache service, timeout with RxJS).' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'NestJS is a structured TypeScript backend framework with Angular-style DI, modules, guards, pipes, and interceptors — strong conventions for large team codebases.',
    mustKnow: [
      'Module: imports/providers/controllers/exports — explicit dependency graph.',
      'Controller: thin route handler. Service: business logic. DI via constructor.',
      'Guards: authentication/authorization. Return true/false or throw.',
      'Pipes: validate (ValidationPipe + class-validator) and transform input.',
      'Interceptors: wrap handler with Observable — logging, caching, response transform.',
      'exports share providers across modules; re-declaring creates a new singleton.',
      'ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }) globally.',
    ],
    interviewFocus: [
      'Explain NestJS module system and how providers are shared between modules.',
      'What is the execution order of guards, interceptors, and pipes?',
      'How does NestJS dependency injection work?',
    ]
  };
}
