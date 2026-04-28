import { api } from '../api';

export interface User {
    id: string;
    email: string;
    full_name?: string;
    role: string;
}

export interface OrganizationMember {
    _id: string;
    email: string;
    full_name?: string;
    organization_role: string;
    membership_status: string;
    joined_at: string;
}

export interface InviteToken {
    _id: string;
    token: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    created_at: string;
}

export const TeamService = {
    getMembers: async (orgId: string, token: string): Promise<OrganizationMember[]> => {
        return api.get(`/organizations/${orgId}/members`, token);
    },

    getInvitations: async (orgId: string, token: string): Promise<InviteToken[]> => {
        return api.get(`/organizations/${orgId}/invitations`, token);
    },

    inviteMember: async (orgId: string, email: string, role: string, token: string): Promise<{ token: string, message: string }> => {
        return api.post(`/organizations/${orgId}/invite`, { email, role }, token);
    },

    revokeInvitation: async (invitationId: string, token: string): Promise<any> => {
        return api.post(`/organizations/invitations/${invitationId}/revoke`, {}, token);
    },

    validateInvite: async (inviteToken: string): Promise<{ email: string, role: string, org_name: string, status: string, user_exists: boolean }> => {
        return api.get(`/organizations/invitations/${inviteToken}`);
    },

    acceptInvite: async (inviteToken: string, token: string): Promise<{ message: string, organization_id: string, org_name: string }> => {
        return api.post(`/organizations/invitations/${inviteToken}/accept`, {}, token);
    }
};
