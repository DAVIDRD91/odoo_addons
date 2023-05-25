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
            recebido_pendente = 0
            pago_pendente = 0
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
                    if line.amount > 0:
                        recebido_pendente += line.amount
                    else:
                        pago_pendente += line.amount
                if not line.liquidity and line.line_type != 'ativo_corrente':
                    balance_period += line.amount
            balance += item.start_amount

            item.start_balance = start_balance
            item.total_payables = payables
            item.total_receivables = receivables
            item.total_pendente = pendente
            item.total_recebido_pendente = recebido_pendente
            item.total_pago_pendente = pago_pendente
            item.period_balance = receivables+payables
            item.final_amount = balance
        return

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
    total_recebido_pendente = fields.Float(string="Total Realizado Pendente",
                                     compute="_compute_final_amount",
                                     digits='Account')
    total_pago_pendente = fields.Float(string="Total Realizado Pendente",
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

    def calc_total_linhas(self,linhas):
        ret = 0
        for item in linhas:
            ret += item.amount

        return ret

    def calcule_resumo_final(self):
        ret = 0
        
        ret = round(self.start_balance+self.total_pendente+self.period_balance,3)
        return ret
    
    def pegue_linhas(self):
        moveline_obj = self.env['account.move.line']
        type_lines = ['liquidez', 'ativo_corrente', 'a_receber', 'a_pagar', 'receita', 'despesa']
        
        domain = [
            ('account_id.hm_category_for_report', 'in', type_lines ),
            ('reconciled', '=', False),
            ('move_id.state', '=', 'posted'),
            ('company_id', '=', self.env.user.company_id.id),
            '|', ('date', '<=', self.end_date),('date_maturity', '<=', self.end_date)
        ]

        # se houver filtro de contas
        if self.account_ids:
            domain += [('account_id.id', 'in', self.account_ids.ids)]
        
        # se ignora vencidos
        if self.ignore_outstanding:
            domain += [('date_maturity', '>=', date.today()) ]

        # se houver data inicial
        if self.start_date:
            domain += [ '|', ('date', '>=', self.start_date),('date_maturity', '>=', self.start_date) ]
            # domain += [('|', ('date_maturity', '>=', self.start_date) )]

        moveline_ids = moveline_obj.search(domain)


        moves = []
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

            # não mostra as linhas com os campos zerados
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
                name = "%s/%s/(%s)" % (move.move_id.name, move.partner_id.name or move.journal_id.name, move.name)
                #Inverte o sinal do valor
                amount = -amount if amount > 0 else abs(amount)
            else:
                name = "%s/%s" % (move.move_id.name, move.ref or move.name)

            moves.append({
                'name': name,
                'partner_id': move.partner_id.id,
                'journal_id': move.journal_id.id,
                'account_id': move.account_id.id,
                'line_type': move.account_id.hm_category_for_report,
                'date': date,
                'debit': debit,
                'credit': credit,
                'amount': amount,
                'status': status,
                'cashflow_id': self.id,
            })

        return moves
    
    def organiza_detalhamento(self):
        
        ordem = [
            {   'descricao':'Caixas e Bancos',
                'linhas': self.filtra_linhas('liquidez'),
                'ver_conta':True,
                'ver_jornal':False,
            },
            {   'descricao':'Valores Pendentes',
                'linhas': self.filtra_linhas('ativo_corrente'),
                'ver_conta':False,
                'ver_jornal':True, 
            },
            {   'descricao':'Contas a Receber',
                'linhas': self.filtra_linhas('a_receber','normal'),
                'ver_conta':False,
                'ver_jornal':True, 
            },
            {   'descricao':'Contas a Receber Vencidos',
                'linhas': self.filtra_linhas('a_receber','vencido'),
                'ver_conta':False,
                'ver_jornal':True, 
            },
            {   'descricao':'Contas a Pagar',
                'linhas': self.filtra_linhas('a_pagar','normal'),
                'ver_conta':False,
                'ver_jornal':True, 
            },
            {   'descricao':'Contas a Pagar Vencidos',
                'linhas': self.filtra_linhas('a_pagar','vencido'),
                'ver_conta':False,
                'ver_jornal':True, 
            },
            {   'descricao':'Registro de Receitas',
                'linhas': self.filtra_linhas('receita'),
                'ver_conta':True,
                'ver_jornal':False, 
            },
            {   'descricao':'Registro de Despesas',
                'linhas': self.filtra_linhas('despesa'),
                'ver_conta': True,
                'ver_jornal': False, 
            },
        ]
        
        return ordem
    
    def filtra_linhas(self,chave='',status=''):
        linhas=''
        
        #Filtra as linhas
        if chave and status:
            linhas = self.line_ids.filtered(lambda x : ( x.line_type == chave and x.status == status) )
        else:
            linhas = self.line_ids.filtered(lambda x : x.line_type == chave)

        #Organiza as linhas
        if chave in ('ativo_corrente'):
            linhas = linhas.sorted( key=lambda x: (x.journal_id.id) )
        elif chave in ('receita','despesa'):
            linhas = linhas.sorted( key=lambda x: (x.account_id.id) )
        else:
            linhas = linhas.sorted( key=lambda x: (x.account_id.id,x.journal_id.id,x.date) )

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

    def action_calculate_report(self):
        self.write({'line_ids': [(5, 0, 0)]})
        liquidity_lines = self.calculate_liquidity()
        move_lines = self.pegue_linhas()

        move_lines.sort(key=lambda x: (x['line_type'],x['date']) )

        for lines in liquidity_lines+move_lines:
            self.env['account.cash.flow.line'].create(lines)


class CashFlowReportLine(models.TransientModel):
    _name = 'account.cash.flow.line'
    _description = u'Cash flow lines'

    name = fields.Char(string="Descrição", required=True)
    liquidity = fields.Boolean(strign=u"Liquidez?")
    line_type = fields.Selection(
        [('liquidez', 'Liquidez'), 
         ('a_receber', 'A receber'),
         ('a_pagar', 'A pagar'), 
         ('ativo_corrente', 'Ativo Corrente'), 
         ('receita', 'Receita'),  
         ('despesa', 'Despesa')], 
        string="Tipo")
    status = fields.Char(string="Status")
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
    
