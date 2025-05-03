import { Routes, ExtraOptions } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FilmsComponent } from './films/films.component';
import { DetailsComponent } from './details/details.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard } from './authguard.service'; 
import { ActorComponent } from './actor/actor.component';
import { MembersComponent } from './members/members.component';
import { CardsComponent } from './cards/cards.component';
import { SearchComponent } from './search/search.component';
import { TopRatedComponent } from './top-rated/top-rated.component';
import { SeriesComponent } from './series/series.component';
import { SettingsComponent } from './settings/settings.component';


export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'films', component: FilmsComponent },
    { path: 'series', component: SeriesComponent },
    { path: 'films/toprated', component: TopRatedComponent },
    { path: 'actuellement-cinema', component: CardsComponent },
    { path: 'membres', component: MembersComponent, canActivate:[AuthGuard] },
    { path: 'film/:id', component: DetailsComponent },
    { path: 'acteur/:id', component: ActorComponent },
    { path: 'actrice/:id', component: ActorComponent },
    { path: 'realisateur/:id', component: ActorComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'search', component: SearchComponent },
    { path: 'logout', component: DashboardComponent },
    { path: 'profil/:nickname', component: DashboardComponent, canActivate: [AuthGuard] },  
    { path: '**', redirectTo: 'home', pathMatch: 'full' }

];