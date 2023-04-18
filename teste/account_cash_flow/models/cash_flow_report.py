# © 2016 Danimar Ribeiro, Trustcode
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import datetime
from datetime import date
from odoo import api, fields, models


class CashFlowReport(models.TransientModel):
    _name = 'account.cash.flow'
    _description = 'Cash Flow Report'

    def _compute_final_amount(self):
        for item in self:
            balance = 0
            start_balance = 0
            receivables = 0
            payables = 0
            pendente = 0
            balance_period = 0
            for line in item.line_ids:
                balance += line.amount
                if line.liquidity:
                    start_balance += line.amount
                if line.line_type == 'a_receber':
                    receivables += line.amount
                if line.line_type == 'a_pagar':
                    payables += line.amount
                if line.line_type == 'ativo_corrente':
                    pendente += line.amount
                if not line.liquidity and line.line_type != 'ativo_corrente':
                    balance_period += line.amount
            balance += item.start_amount

            item.start_balance = start_balance
            item.total_payables = payables
            item.total_receivables = receivables
            item.total_pendente = pendente
            item.period_balance = balance_period
            item.final_amount = balance

    ignore_outstanding = fields.Boolean(string="Ignorar Vencidos?")
    account_ids = fields.Many2many('account.account', string="Filtrar Contas")
    start_date = fields.Date(
        string="Data Inicial",default="")
    end_date = fields.Date(
        string="Data Final", required=True,
        default=fields.date.today()+datetime.timedelta(1*365/12))
    start_amount = fields.Float(string="Valor Inicial",
                                digits='Account')
    start_balance = fields.Float(string="Saldo Inicial",
                                 compute="_compute_final_amount",
                                 digits='Account')
    total_pendente = fields.Float(string="Total Realizado Pendente",
                                     compute="_compute_final_amount",
                                     digits='Account')
    total_receivables = fields.Float(string="Total de Recebimentos",
                                     compute="_compute_final_amount",
                                     digits='Account')
    total_payables = fields.Float(string="Total de Despesas",
                                  compute="_compute_final_amount",
                                  digits='Account')
    period_balance = fields.Float(string="Saldo do Período",
                                  compute="_compute_final_amount",
                                  digits='Account')
    final_amount = fields.Float(string="Saldo Final",
                                compute="_compute_final_amount",
                                digits='Account')
    line_ids = fields.One2many(
        "account.cash.flow.line", "cashflow_id",
        string="Cash Flow Lines")

    def calcule_total_pendente(self):
        ret = []
        for item in self:
            recebido = 0
            pago = 0
            for line in item.line_ids:
                if line.line_type == 'ativo_corrente':
                    recebido += line.amount if line.amount > 0 else 0.0
                    pago += line.amount if line.amount < 0 else 0.0
                
            ret.append({
                'recebido': round(recebido,3),
                'pago': round(pago,3),
                'resultado' : recebido+pago,
            })
        return ret

    def calcule_resumo_final(self):
        ret = 0
        
        ret = round(self.start_balance+self.total_pendente+self.period_balance,3)
        return ret
    
    def pegue_linhas(self):
        moveline_obj = self.env['account.move.line']
        domain = [
            ('account_id.hm_category_for_report', 'in', ['liquidez', 'ativo_corrente', 'a_receber', 'a_pagar', 'receita', 'despesa']),
            ('reconciled', '=', False),
            ('move_id.state', '=', 'posted'),
            ('company_id', '=', self.env.user.company_id.id),
            ('date', '<=', self.end_date),
        ]

        # se houver data inicial
        if self.start_date:
            domain += [('date', '>=', self.start_date)]

        # se houver filtro de contas
        if self.account_ids:
            domain += [('account_id.id', 'in', self.account_ids.ids)]

        moveline_ids = moveline_obj.search(domain)

        moves = {}
        for move in moveline_ids:
            status  = "normal"
            date    = move.date
            chave   = move.account_id.hm_category_for_report

            if move.amount_residual:
                debit   = move.amount_residual if move.amount_residual < 0 else 0.0
                credit  = move.amount_residual if move.amount_residual > 0 else 0.0
            else:
                debit   = move.debit if move.debit > 0 else 0.0
                credit  = -move.credit if move.credit > 0 else 0.0
            amount = credit + debit

            # temporário: não mostra as linhas com os campos zerados
            if not credit and not debit:
                continue

            if move.date_maturity and move.date_maturity < date.today():
                status = "vencido"

            if move.account_id.hm_category_for_report == 'ativo_corrente':
                name = "%s/%s" % (move.move_id.name, move.name or move.ref)
            elif move.account_id.hm_category_for_report in ['a_receber', 'a_pagar']:
                name = "%s/%s" % (move.move_id.name, move.partner_id.name or "Não Informado")
                date = move.date_maturity
            elif move.account_id.hm_category_for_report in ['receita', 'despesa']:
                name = "%s/%s" % (move.move_id.name, move.partner_id.name or move.journal_id.name)
                #Inverte o sinal do valor
                amount = -amount if amount > 0 else abs(amount)
            else:
                name = "%s/%s" % (move.move_id.name, move.ref or move.name)

            if chave not in moves:
                moves[chave] = []

            moves[chave].append({
                'name': name,
                'partner': (move.partner_id.name or "Cliente Padrão"),
                'journal': move.journal_id.name,
                'account': move.account_id.name,
                'line_type': move.account_id.hm_category_for_report,
                'date': date,
                'debit': debit,
                'credit': credit,
                'amount': amount,
                'status': status,
            })

        moves = self.organiza_linhas(moves)

        return moves
    
    def organiza_linhas(self,moves):

        # organiza ativo corrente
        if moves['ativo_corrente']:
            moves['ativo_corrente'] = sorted(moves['ativo_corrente'], key=lambda x: (x['journal'],x['date'])) 

        # organiza a receber
        if moves['a_receber']:
            moves['a_receber'] = sorted(moves['a_receber'], key=lambda x: (x['journal'], x['date'])) 
        
        # organiza a pagar
        if moves['a_pagar']:
            moves['a_pagar'] = sorted(moves['a_pagar'], key=lambda x: (x['journal'], x['date'])) 

        # organiza a receita
        if moves['receita']:
            moves['receita'] = sorted(moves['receita'], key=lambda x: (x['status'], x['account'], x['date'])) 
        
        # organiza a despesa
        if moves['despesa']:
            moves['despesa'] = sorted(moves['despesa'], key=lambda x: (x['status'], x['account'], x['date'])) 

        return moves
    
    def filtra_linhas(self,registros,chave):
        linhas = []
        tipo_chave = "0"

        if chave in ("normal","vencido"):
            tipo_chave = "status"

        elif chave in ("receita","despesa"):
            tipo_chave = "line_type"
        

        for registro in registros:
            if registro[tipo_chave] == chave:
                linhas.append(registro)
                
        return linhas
    
    def calculate_liquidity(self):
        domain = [('hm_category_for_report', '=', 'liquidez')]
        if self.account_ids:
            domain += [('id', 'in', self.account_ids.ids)]
        accs = self.env['account.account'].search(domain)
        liquidity_lines = []
        for acc in accs:
            self.env.cr.execute(
                "select sum(debit - credit) as val from account_move_line aml \
                inner join account_move am on aml.move_id = am.id \
                where account_id = %s and am.state = 'posted'", (acc.id, ))
            total = self.env.cr.fetchone()
            if total[0]:
                liquidity_lines.append({
                    'name': '%s - %s' % (acc.code, acc.name),
                    'cashflow_id': self.id,
                    'account_id': acc.id,
                    'debit': 0,
                    'credit': total[0],
                    'amount': total[0],
                    'liquidity': True,
                })
        return liquidity_lines

    def calculate_moves(self):
        moveline_obj = self.env['account.move.line']
        domain = [
            '|',
            ('account_id.hm_category_for_report', '=', 'a_receber'),'|',
            ('account_id.hm_category_for_report', '=', 'a_pagar'),
            ('account_id.hm_category_for_report', '=', 'ativo_corrente'),
            ('reconciled', '=', False),
            ('move_id.state', '!=', 'draft'),
            ('company_id', '=', self.env.user.company_id.id),
            ('date_maturity', '<=', self.end_date),
        ]
        if self.ignore_outstanding:
            domain += [('date_maturity', '>=', date.today())]
        moveline_ids = moveline_obj.search(domain)

        moves = []
        for move in moveline_ids:
            # if move.amount_residual:
            debit = move.amount_residual if move.amount_residual < 0 else 0.0
            credit = move.amount_residual if move.amount_residual > 0 else 0.0
            amount = credit + debit
            # else:
            #     debit = move.debit if move.debit < 0 else 0.0
            #     credit = move.credit if move.credit > 0 else 0.0
            #     amount = credit + debit

            # Temporário: não mostra as linhas com os campos 'a receber' e
            # 'a pagar' zerados
            if not credit and not debit:
                continue

            name = "%s/%s" % (move.move_id.name, move.ref or move.name)
            moves.append({
                'name': name,
                'cashflow_id': self.id,
                'partner_id': move.partner_id.id,
                'journal_id': move.journal_id.id,
                'account_id': move.account_id.id,
                'line_type': move.account_id.hm_category_for_report,
                'date': move.date_maturity,
                'debit': debit,
                'credit': credit,
                'amount': amount,
            })
        return moves

    def action_calculate_report(self):
        self.write({'line_ids': [(5, 0, 0)]})
        balance = self.start_amount
        liquidity_lines = self.calculate_liquidity()
        move_lines = self.calculate_moves()

        move_lines.sort(key=lambda x: x['date'])

        for lines in liquidity_lines+move_lines:
            balance += lines['credit'] + lines['debit']
            lines['balance'] = balance
            self.env['account.cash.flow.line'].create(lines)


class CashFlowReportLine(models.TransientModel):
    _name = 'account.cash.flow.line'
    _description = u'Cash flow lines'

    name = fields.Char(string="Descrição", required=True)
    liquidity = fields.Boolean(strign=u"Liquidez?")
    # line_type = fields.Selection(
    #     [('receivable', 'Recebível'), ('payable', 'Pagável')], string="Tipo")
    #line_type = fields.Selection([], string="Tipo")
    line_type = fields.Selection(
        [('liquidez', 'Liquidez'), 
         ('a_receber', 'A receber'),
         ('a_pagar', 'A pagar'), 
         ('ativo_corrente', 'Ativo Corrente'), 
         ('receita', 'Receita'),  
         ('despesa', 'Despesa')], 
        string="Tipo")
    date = fields.Date(string="Data")
    partner_id = fields.Many2one("res.partner", string="Cliente")
    account_id = fields.Many2one("account.account", string="Conta Contábil")
    journal_id = fields.Many2one("account.journal", string="Diário")
    move_id = fields.Many2one("account.move", string="Fatura")
    debit = fields.Float(string="Débito", digits='Account')
    credit = fields.Float(string="Crédito", digits='Account')
    amount = fields.Float(string="Saldo(C-D)", digits='Account')
    balance = fields.Float(string="Saldo Acumulado", digits='Account')
    cashflow_id = fields.Many2one("account.cash.flow", string="Fluxo de Caixa")
