import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FilmsComponent } from './films/films.component';
import { DetailsComponent } from './details/details.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuardService } from './authguard.service'; 


export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'films', component: FilmsComponent },
    { path: 'film/:id', component: DetailsComponent },
    { path: 'register', component: RegisterComponent, },
    { path: 'login', component: LoginComponent},
    { path: 'logout', component: DashboardComponent },
    { path: 'profil', component: DashboardComponent },
    { path: '**', redirectTo: 'home', pathMatch: 'full' }

];