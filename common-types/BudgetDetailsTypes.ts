export enum BudgetType {
    'COST' = 'COST',
    'USAGE' = 'USAGE'
}

export enum TimeUnit {
    'ANNUALLY' = 'ANNUALLY',
    'DAILY' = 'DAILY',
    'MONTHLY' = 'MONTHLY',
    'QUARTERLY' = 'QUARTERLY'
}

export enum ActionThresholdType {
    'PERCENTAGE' = 'PERCENTAGE',
    'ACTION_THRESHOLD_VALUE' = 'ACTION_THRESHOLD_VALUE'
}

export type ActionThreshold = {
    type: ActionThresholdType,
    value: number
}

export type BudgetDetails = {
    name: string,
    budgetType?: BudgetType,
    usdLimitAmount?: number,
    timeUnit?: TimeUnit,
    actionThreshold?: ActionThreshold
}

export const awsManagedBudgetPolicy = 'arn:aws:iam::aws:policy/AWSBudgetsActions_RolePolicyForResourceAdministrationWithSSM'
