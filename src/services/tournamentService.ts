import { api } from './api';

export interface Tournament {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  tournament_date: string;
  start_time?: string;
  tournament_end_date?: string;
  location?: string;
  format: 'double_elimination' | 'single_elimination' | 'group_stage';
  team_size: number;
  max_participants?: number;
  status: 'draft' | 'registration' | 'ready' | 'live' | 'finished' | 'cancelled';
  registration_mode: 'manual' | 'link' | 'open';
  registration_token?: string;
  registration_deadline?: string;
  require_approval: boolean;
  show_scores_to_students: boolean;
  third_place_match: boolean;
  bracket_generated: boolean;
  started_at?: string;
  finished_at?: string;
  winner_team_id?: number;
  team_count?: number;
  created_at: string;
  updated_at: string;
  // Group stage fields
  num_groups?: number;
  teams_per_group?: number;
  advance_per_group?: number;
  knockout_format?: 'single_elimination' | 'double_elimination';
  points_win?: number;
  points_draw?: number;
  points_loss?: number;
  group_stage_completed?: boolean;
}

export interface TournamentTeam {
  id: number;
  tournament_id: number;
  name: string;
  seed: number;
  status: string;
  registration_source: string;
  wins: number;
  losses: number;
  total_points_scored: number;
  total_points_conceded: number;
  members?: TeamMember[];
}

export interface TeamMember {
  name: string;
  student_id?: string;
  email?: string;
  is_captain: boolean;
}

export interface GroupStanding {
  team_id: number;
  team_name: string;
  position: number;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  points_for: number;
  points_against: number;
  point_diff: number;
  advances: boolean;
}

export interface TournamentGroup {
  id: number;
  group_name: string;
  group_number: number;
  standings: GroupStanding[];
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  id: number;
  tournament_id: number;
  bracket_type: 'winners' | 'losers' | 'grand_final' | 'third_place' | 'group';
  round_number: number;
  position: number;
  match_number: number;
  team1_id?: number;
  team2_id?: number;
  winner_id?: number;
  loser_id?: number;
  team1_score?: number;
  team2_score?: number;
  team1_name?: string;
  team2_name?: string;
  is_bye: boolean;
  status: 'pending' | 'live' | 'completed';
  next_winner_match_id?: number;
  next_winner_slot?: number;
  next_loser_match_id?: number;
  next_loser_slot?: number;
  scheduled_time?: string;
  court_name?: string;
  started_at?: string;
  completed_at?: string;
}

export interface BracketData {
  winners: TournamentMatch[][];
  losers: TournamentMatch[][];
  grand_final?: TournamentMatch;
  third_place?: TournamentMatch;
  teams: TournamentTeam[];
  groups?: TournamentGroup[];
  group_stage_completed?: boolean;
}

export interface TournamentRanking {
  id: number;
  student_id?: number;
  external_name?: string;
  student_name?: string;
  tournaments_played: number;
  tournaments_won: number;
  matches_won: number;
  matches_lost: number;
  total_points_scored: number;
  ranking_points: number;
}

export const tournamentService = {
  // ─── Gestor ───
  async getTournaments(params?: { status?: string }): Promise<{ status: string; data: Tournament[] }> {
    const response = await api.get('/api/tournaments', { params });
    return response.data;
  },

  async getTournament(id: number): Promise<{ status: string; data: Tournament & { teams: TournamentTeam[] } }> {
    const response = await api.get(`/api/tournaments/${id}`);
    return response.data;
  },

  async createTournament(formData: FormData): Promise<{ status: string; data: Tournament }> {
    const response = await api.post('/api/tournaments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async updateTournament(id: number, formData: FormData): Promise<{ status: string; data: Tournament }> {
    const response = await api.put(`/api/tournaments/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async deleteTournament(id: number): Promise<{ status: string; message: string }> {
    const response = await api.delete(`/api/tournaments/${id}`);
    return response.data;
  },

  // Teams
  async addTeam(tournamentId: number, data: { name?: string; members: any[] }): Promise<{ status: string; data: TournamentTeam }> {
    const response = await api.post(`/api/tournaments/${tournamentId}/teams`, data);
    return response.data;
  },

  async updateTeam(tournamentId: number, teamId: number, data: { name?: string; seed?: number }): Promise<{ status: string; data: TournamentTeam }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/teams/${teamId}`, data);
    return response.data;
  },

  async removeTeam(tournamentId: number, teamId: number): Promise<{ status: string; message: string }> {
    const response = await api.delete(`/api/tournaments/${tournamentId}/teams/${teamId}`);
    return response.data;
  },

  async approveTeam(tournamentId: number, teamId: number): Promise<{ status: string; message: string }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/teams/${teamId}/approve`);
    return response.data;
  },

  // Bracket
  async generateBracket(tournamentId: number): Promise<{ status: string; data: BracketData }> {
    const response = await api.post(`/api/tournaments/${tournamentId}/generate-bracket`);
    return response.data;
  },

  async getBracket(tournamentId: number): Promise<{ status: string; data: BracketData }> {
    const response = await api.get(`/api/tournaments/${tournamentId}/bracket`);
    return response.data;
  },

  // Tournament control
  async startTournament(tournamentId: number): Promise<{ status: string; message: string }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/start`);
    return response.data;
  },

  async finishTournament(tournamentId: number): Promise<{ status: string; message: string }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/finish`);
    return response.data;
  },

  async regenerateLink(tournamentId: number): Promise<{ status: string; data: { registration_token: string } }> {
    const response = await api.post(`/api/tournaments/${tournamentId}/regenerate-link`);
    return response.data;
  },

  // Match control
  async startMatch(tournamentId: number, matchId: number): Promise<{ status: string; data: TournamentMatch }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/matches/${matchId}/start`);
    return response.data;
  },

  async updateMatchScore(tournamentId: number, matchId: number, data: { team_id: number; points?: number; action?: string }): Promise<{ status: string; data: TournamentMatch }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/matches/${matchId}/score`, data);
    return response.data;
  },

  async reportMatchResult(tournamentId: number, matchId: number, data: { winner_id: number; team1_score?: number; team2_score?: number }): Promise<{ status: string; data: BracketData }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, data);
    return response.data;
  },

  // Groups
  async getGroupStandings(tournamentId: number): Promise<{ status: string; data: { groups: TournamentGroup[] } }> {
    const response = await api.get(`/api/tournaments/${tournamentId}/groups`);
    return response.data;
  },

  async completeGroupStage(tournamentId: number): Promise<{ status: string; data: BracketData }> {
    const response = await api.put(`/api/tournaments/${tournamentId}/complete-groups`);
    return response.data;
  },

  // Search students
  async searchStudents(query: string): Promise<{ status: string; data: { id: number; name: string; email: string }[] }> {
    const response = await api.get('/api/tournaments/search-students', { params: { q: query } });
    return response.data;
  },

  // Rankings
  async getRankings(): Promise<{ status: string; data: TournamentRanking[] }> {
    const response = await api.get('/api/tournaments/rankings');
    return response.data;
  },
};
