import { Routes, ExtraOptions } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FilmsComponent } from './films/films.component';
import { DetailsComponent } from './details/details.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './authguard.service'; 
import { noAuthGuard } from './no-auth.guard';
import { ActorComponent } from './actor/actor.component';
import { MembersComponent } from './members/members.component';
import { CardsComponent } from './cards/cards.component';
import { SearchComponent } from './search/search.component';
import { TopRatedComponent } from './top-rated/top-rated.component';


export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'films', component: FilmsComponent },
    { path: 'top-rated', component: TopRatedComponent },
    { path: 'actuellement-cinema', component: CardsComponent },
    { path: 'membres', component: MembersComponent, canActivate:[AuthGuard] },
    { path: 'film/:id', component: DetailsComponent },
    { path: 'acteur/:id', component: ActorComponent },
    { path: 'realisateur/:id', component: ActorComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'search', component: SearchComponent },
    { path: 'logout', component: DashboardComponent },
    { path: 'profil/:nickname', component: DashboardComponent, canActivate: [AuthGuard] },  
    { path: '**', redirectTo: 'home', pathMatch: 'full' }

];