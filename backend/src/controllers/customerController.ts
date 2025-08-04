import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Customer, ICustomer } from '../models/Customer';
import { User } from '../models/User';
import { AIService } from '../services/aiService';
import { FileService, fileService } from '../services/fileService';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';
import { Types } from 'mongoose';
import * as XLSX from 'xlsx';

export class CustomerController {
  /**
   * 获取用户的所有客户
   */
  static getCustomers = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      folder, 
      priority, 
      status,
      industry,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const query: any = { userId: new Types.ObjectId(userId) };

    if (search) {
      query.$or = [
        { 'basicInfo.name': { $regex: search, $options: 'i' } },
        { 'basicInfo.company': { $regex: search, $options: 'i' } },
        { 'basicInfo.position': { $regex: search, $options: 'i' } },
        { 'basicInfo.email': { $regex: search, $options: 'i' } },
        { 'tags.name': { $regex: search, $options: 'i' } }
      ];
    }

    if (folder && folder !== 'all') {
      query.folder = folder;
    }

    if (priority) {
      query.priority = priority;
    }

    if (status) {
      query.status = status;
    }

    if (industry) {
      query['basicInfo.industry'] = industry;
    }

    // 排序
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'firstName lastName')
        .lean(),
      Customer.countDocuments(query)
    ]);

    logger.info('获取客户列表', {
      userId,
      total,
      page: pageNum,
      limit: limitNum,
      search,
      folder
    });

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          current: pageNum,
          total: Math.ceil(total / limitNum),
          count: total,
          limit: limitNum
        }
      }
    });
  });

  /**
   * 获取单个客户详情
   */
  static getCustomer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    }).populate('userId', 'firstName lastName');

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    logger.info('获取客户详情', { customerId: id, userId });

    res.json({
      success: true,
      data: customer
    });
  });

  /**
   * 创建新客户
   */
  static createCustomer = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const customerData = req.body;

    // 检查邮箱是否已存在
    if (customerData.basicInfo?.email) {
      const existingCustomer = await Customer.findOne({
        userId: new Types.ObjectId(userId),
        'basicInfo.email': customerData.basicInfo.email
      });

      if (existingCustomer) {
        throw ApiError.badRequest('该邮箱已存在客户记录');
      }
    }

    const customer = new Customer({
      ...customerData,
      userId: new Types.ObjectId(userId)
    });

    await customer.save();

    logger.info('创建客户', {
      customerId: customer._id,
      userId,
      name: customer.basicInfo?.name
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: '客户创建成功'
    });
  });

  /**
   * 更新客户信息
   */
  static updateCustomer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    // 检查邮箱是否与其他客户冲突
    if (updateData.basicInfo?.email && updateData.basicInfo.email !== customer.basicInfo?.email) {
      const existingCustomer = await Customer.findOne({
        userId: new Types.ObjectId(userId),
        'basicInfo.email': updateData.basicInfo.email,
        _id: { $ne: new Types.ObjectId(id) }
      });

      if (existingCustomer) {
        throw ApiError.badRequest('该邮箱已存在其他客户记录');
      }
    }

    Object.assign(customer, updateData);
    customer.updatedAt = new Date();
    await customer.save();

    logger.info('更新客户', {
      customerId: id,
      userId,
      name: customer.basicInfo?.name
    });

    res.json({
      success: true,
      data: customer,
      message: '客户更新成功'
    });
  });

  /**
   * 删除客户
   */
  static deleteCustomer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    // 删除相关文件
    if (customer.basicInfo?.avatar) {
      try {
        await fileService.deleteFile(customer.basicInfo.avatar);
      } catch (error) {
        logger.warn('删除客户头像失败', { error, customerId: id });
      }
    }

    await Customer.findByIdAndDelete(id);

    logger.info('删除客户', {
      customerId: id,
      userId,
      name: customer.basicInfo?.name
    });

    res.json({
      success: true,
      message: '客户删除成功'
    });
  });

  /**
   * 批量删除客户
   */
  static batchDeleteCustomers = catchAsync(async (req: Request, res: Response) => {
    const { customerIds } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw ApiError.badRequest('请提供要删除的客户ID列表');
    }

    const customers = await Customer.find({
      _id: { $in: customerIds.map(id => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId)
    });

    if (customers.length !== customerIds.length) {
      throw ApiError.badRequest('部分客户不存在或无权限删除');
    }

    // 删除相关文件
    const deleteFilePromises = customers
      .filter((customer: any) => customer.basicInfo?.avatar)
      .map((customer: any) => fileService.deleteFile(customer.basicInfo!.avatar!)
        .catch((error: any) => logger.warn('删除客户头像失败', { error: error.message, customerId: customer._id }))
      );

    await Promise.all(deleteFilePromises);

    // 删除客户
    await Customer.deleteMany({
      _id: { $in: customerIds.map(id => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId)
    });

    logger.info('批量删除客户', {
      customerIds,
      userId,
      count: customers.length
    });

    res.json({
      success: true,
      message: `成功删除 ${customers.length} 个客户`
    });
  });

  /**
   * 上传客户头像
   */
  static uploadPhoto = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const file = req.file;

    if (!file) {
      throw ApiError.badRequest('请选择要上传的图片文件');
    }

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    try {
      // 删除旧头像
      if (customer.basicInfo?.avatar) {
        await fileService.deleteFile(customer.basicInfo.avatar);
      }

      // 上传新头像
      const uploadResult = await fileService.uploadImage(file, 'avatar');

      // 更新客户头像信息
      if (!customer.basicInfo) {
          customer.basicInfo = { name: '' };
        }
      customer.basicInfo.avatar = uploadResult;
      customer.updatedAt = new Date();
      await customer.save();

      logger.info('上传客户头像', {
        customerId: id,
        userId,
        fileUrl: uploadResult
      });

      res.json({
        success: true,
        data: {
          avatar: uploadResult
        },
        message: '头像上传成功'
      });
    } catch (error: any) {
      logger.error(`上传客户头像失败: ${error.message}`);
      throw ApiError.internal('头像上传失败');
    }
  });

  /**
   * 删除客户头像
   */
  static deletePhoto = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    if (!customer.basicInfo?.avatar) {
      throw ApiError.badRequest('客户没有头像');
    }

    try {
      // 删除文件
      await fileService.deleteFile(customer.basicInfo.avatar);

      // 更新客户信息
      customer.basicInfo.avatar = undefined;
      customer.updatedAt = new Date();
      await customer.save();

      logger.info('删除客户头像', {
        customerId: id,
        userId
      });

      res.json({
        success: true,
        message: '头像删除成功'
      });
    } catch (error: any) {
      logger.error(`删除客户头像失败: ${error.message}`);
      throw ApiError.internal('头像删除失败');
    }
  });

  /**
   * 获取客户文件夹列表
   */
  static getFolders = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const folders = await Customer.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$folder',
          count: { $sum: 1 },
          lastUpdated: { $max: '$updatedAt' }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          lastUpdated: 1,
          _id: 0
        }
      },
      { $sort: { name: 1 } }
    ]);

    // 添加默认文件夹
    const allCount = await Customer.countDocuments({ userId: new Types.ObjectId(userId) });
    const result = [
      { name: 'all', count: allCount, lastUpdated: new Date() },
      ...folders.filter((folder: any) => folder.name && folder.name !== 'all')
    ];

    logger.info('获取客户文件夹', { userId, foldersCount: result.length });

    res.json({
      success: true,
      data: result
    });
  });

  /**
   * 移动客户到文件夹
   */
  static moveToFolder = catchAsync(async (req: Request, res: Response) => {
    const { customerIds, folder } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      throw ApiError.badRequest('请提供要移动的客户ID列表');
    }

    const result = await Customer.updateMany(
      {
        _id: { $in: customerIds.map(id => new Types.ObjectId(id)) },
        userId: new Types.ObjectId(userId)
      },
      {
        $set: {
          folder: folder || 'default',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount !== customerIds.length) {
      throw ApiError.badRequest('部分客户不存在或无权限操作');
    }

    logger.info('移动客户到文件夹', {
      customerIds,
      folder,
      userId,
      count: result.modifiedCount
    });

    res.json({
      success: true,
      message: `成功移动 ${result.modifiedCount} 个客户到文件夹 "${folder || 'default'}"`
    });
  });

  /**
   * 更新客户标签
   */
  static updateTags = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tags } = req.body;
    const userId = req.user?.id;

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    customer.tags = tags || [];
    customer.updatedAt = new Date();
    await customer.save();

    logger.info('更新客户标签', {
      customerId: id,
      userId,
      tags: tags?.map((tag: any) => tag.name)
    });

    res.json({
      success: true,
      data: customer,
      message: '标签更新成功'
    });
  });

  /**
   * 添加客户交互记录
   */
  static addInteraction = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type, content, date, duration, outcome } = req.body;
    const userId = req.user?.id;

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    const interaction = {
      type,
      content,
      date: date ? new Date(date) : new Date(),
      duration,
      outcome,
      createdBy: new Types.ObjectId(userId),
      createdAt: new Date()
    };

    if (!customer.interactions) {
      customer.interactions = [];
    }
    customer.interactions.push(interaction);
    customer.updatedAt = new Date();
    await customer.save();

    logger.info('添加客户交互记录', {
      customerId: id,
      userId,
      interactionType: type
    });

    res.json({
      success: true,
      data: interaction,
      message: '交互记录添加成功'
    });
  });

  /**
   * 获取客户交互记录
   */
  static getInteractions = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 20, type } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const customer = await Customer.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId)
    });

    if (!customer) {
      throw ApiError.notFound('客户不存在');
    }

    let interactions = customer.interactions || [];

    // 按类型过滤
    if (type) {
      interactions = interactions.filter((interaction: any) => interaction.type === type);
    }

    // 排序（最新的在前）
    interactions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 分页
    const total = interactions.length;
    const paginatedInteractions = interactions.slice(skip, skip + limitNum);

    logger.info('获取客户交互记录', {
      customerId: id,
      userId,
      total,
      type
    });

    res.json({
      success: true,
      data: {
        interactions: paginatedInteractions,
        pagination: {
          current: pageNum,
          total: Math.ceil(total / limitNum),
          count: total,
          limit: limitNum
        }
      }
    });
  });

  /**
   * 获取客户统计信息
   */
  static getStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const [totalCustomers, statusStats, priorityStats, industryStats, recentCustomers] = await Promise.all([
      // 总客户数
      Customer.countDocuments({ userId: new Types.ObjectId(userId) }),
      
      // 状态统计
      Customer.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // 优先级统计
      Customer.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // 行业统计
      Customer.aggregate([
        { $match: { userId: new Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$basicInfo.industry',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // 最近添加的客户
      Customer.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('basicInfo.name basicInfo.company status createdAt')
        .lean()
    ]);

    logger.info('获取客户统计', { userId, totalCustomers });

    res.json({
      success: true,
      data: {
        totalCustomers,
        statusStats,
        priorityStats,
        industryStats,
        recentCustomers
      }
    });
  });

  /**
   * 导出客户数据
   */
  static exportCustomers = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { search, folder, priority, status, industry } = req.query;

    // 构建查询条件
    const query: any = { userId: new Types.ObjectId(userId) };

    if (search) {
      query.$or = [
        { 'basicInfo.name': { $regex: search, $options: 'i' } },
        { 'basicInfo.company': { $regex: search, $options: 'i' } },
        { 'basicInfo.position': { $regex: search, $options: 'i' } },
        { 'basicInfo.email': { $regex: search, $options: 'i' } }
      ];
    }

    if (folder && folder !== 'all') {
      query.folder = folder;
    }

    if (priority) {
      query.priority = priority;
    }

    if (status) {
      query.status = status;
    }

    if (industry) {
      query['basicInfo.industry'] = industry;
    }

    const customers = await Customer.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    // 转换数据格式
    const exportData = customers.map((customer: any) => ({
      '姓名': customer.basicInfo?.name || '',
      '公司': customer.basicInfo?.company || '',
      '职位': customer.basicInfo?.position || '',
      '邮箱': customer.basicInfo?.email || '',
      '手机': customer.basicInfo?.phone || '',
      '行业': customer.basicInfo?.industry || '',
      '地址': customer.basicInfo?.location || '',
      '状态': customer.status || '',
      '优先级': customer.priority || '',
      '来源': customer.source || '',
      '文件夹': customer.folder || '',
      '标签': customer.tags?.map((tag: any) => tag.name).join(', ') || '',
      '备注': customer.notes || '',
      '创建时间': customer.createdAt ? new Date(customer.createdAt).toLocaleString('zh-CN') : '',
      '更新时间': customer.updatedAt ? new Date(customer.updatedAt).toLocaleString('zh-CN') : ''
    }));

    // 创建Excel工作簿
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '客户数据');

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    logger.info('导出客户数据', {
      userId,
      count: customers.length,
      filters: { search, folder, priority, status, industry }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="customers_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(excelBuffer);
  });
}

export default CustomerController;