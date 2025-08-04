import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Contact, IContact } from '../models/Contact';
import { User } from '../models/User';
import { AIService } from '../services/aiService';
import { fileService } from '../services/fileService';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';
import { Types } from 'mongoose';

export class ContactController {
  /**
   * 获取用户的所有联系人
   */
  static getContacts = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      folder, 
      priority, 
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
      query.priority = parseInt(priority as string);
    }

    if (industry && industry !== 'all') {
      query['basicInfo.industry'] = industry;
    }

    // 构建排序条件
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('interactionCount')
        .lean(),
      Contact.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  });

  /**
   * 根据ID获取单个联系人
   */
  static getContact = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const contact = await Contact.findOne({ 
      _id: id, 
      userId: new Types.ObjectId(userId) 
    }).populate('interactionCount');

    if (!contact) {
      throw new ApiError(404, '联系人不存在');
    }

    res.json({
      success: true,
      data: contact
    });
  });

  /**
   * 创建新联系人
   */
  static createContact = catchAsync(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, '输入数据验证失败', errors.array());
    }

    const userId = req.user?.id;
    const contactData = {
      ...req.body,
      userId: new Types.ObjectId(userId)
    };

    // 检查邮箱是否已存在
    const existingContact = await Contact.findOne({
      userId: new Types.ObjectId(userId),
      'basicInfo.email': contactData.basicInfo.email
    });

    if (existingContact) {
      throw new ApiError(400, '该邮箱的联系人已存在');
    }

    const contact = new Contact(contactData);
    await contact.save();

    // 异步生成AI画像
    AIService.generateContactProfile((contact._id as any).toString())
      .catch(error => {
        logger.error('生成AI画像失败:', error);
      });

    res.status(201).json({
      success: true,
      data: contact,
      message: '联系人创建成功'
    });
  });

  /**
   * 更新联系人信息
   */
  static updateContact = catchAsync(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, '输入数据验证失败', errors.array());
    }

    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    // 如果更新邮箱，检查是否与其他联系人冲突
    if (updateData.basicInfo?.email) {
      const existingContact = await Contact.findOne({
        _id: { $ne: id },
        userId: new Types.ObjectId(userId),
        'basicInfo.email': updateData.basicInfo.email
      });

      if (existingContact) {
        throw new ApiError(400, '该邮箱的联系人已存在');
      }
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!contact) {
      throw new ApiError(404, '联系人不存在');
    }

    // 如果更新了基本信息，重新生成AI画像
    if (updateData.basicInfo || updateData.tags) {
      AIService.generateContactProfile((contact._id as any).toString())
        .catch(error => {
          logger.error('重新生成AI画像失败:', error);
        });
    }

    res.json({
      success: true,
      data: contact,
      message: '联系人更新成功'
    });
  });

  /**
   * 删除联系人
   */
  static deleteContact = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const contact = await Contact.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(userId)
    });

    if (!contact) {
      throw new ApiError(404, '联系人不存在');
    }

    // 删除相关的互动记录和文件
    // 这里可以添加级联删除逻辑

    res.json({
      success: true,
      message: '联系人删除成功'
    });
  });

  /**
   * 批量删除联系人
   */
  static batchDeleteContacts = catchAsync(async (req: Request, res: Response) => {
    const { ids } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, '请提供要删除的联系人ID列表');
    }

    const result = await Contact.deleteMany({
      _id: { $in: ids },
      userId: new Types.ObjectId(userId)
    });

    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `成功删除 ${result.deletedCount} 个联系人`
    });
  });

  /**
   * 上传联系人照片
   */
  static uploadPhoto = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const file = req.file;

    if (!file) {
      throw new ApiError(400, '请上传图片文件');
    }

    const contact = await Contact.findOne({
      _id: id,
      userId: new Types.ObjectId(userId)
    });

    if (!contact) {
      throw new ApiError(404, '联系人不存在');
    }

    // 处理图片上传
    const photoUrl = await fileService.uploadImage(file, 'contacts');

    // 添加照片到联系人记录
    contact.photos.push({
      url: photoUrl,
      type: 'profile',
      source: 'upload',
      uploadedAt: new Date()
    });

    await contact.save();

    res.json({
      success: true,
      data: {
        photoUrl,
        contact
      },
      message: '照片上传成功'
    });
  });

  /**
   * 删除联系人照片
   */
  static deletePhoto = catchAsync(async (req: Request, res: Response) => {
    const { id, photoIndex } = req.params;
    const userId = req.user?.id;

    const contact = await Contact.findOne({
      _id: id,
      userId: new Types.ObjectId(userId)
    });

    if (!contact) {
      throw new ApiError(404, '联系人不存在');
    }

    const index = parseInt(photoIndex);
    if (index < 0 || index >= contact.photos.length) {
      throw new ApiError(400, '照片索引无效');
    }

    const photo = contact.photos[index];
    
    // 删除文件
    await fileService.deleteFile(photo.url);
    
    // 从数组中移除
    contact.photos.splice(index, 1);
    await contact.save();

    res.json({
      success: true,
      message: '照片删除成功'
    });
  });

  /**
   * 获取联系人文件夹列表
   */
  static getFolders = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const folders = await Contact.distinct('folder', {
      userId: new Types.ObjectId(userId)
    });

    // 获取每个文件夹的联系人数量
    const folderStats = await Contact.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: '$folder', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const foldersWithStats = folderStats.map(stat => ({
      name: stat._id,
      count: stat.count
    }));

    res.json({
      success: true,
      data: {
        folders: foldersWithStats
      }
    });
  });

  /**
   * 移动联系人到文件夹
   */
  static moveToFolder = catchAsync(async (req: Request, res: Response) => {
    const { ids, folder } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError(400, '请提供要移动的联系人ID列表');
    }

    if (!folder || typeof folder !== 'string') {
      throw new ApiError(400, '请提供有效的文件夹名称');
    }

    const result = await Contact.updateMany(
      {
        _id: { $in: ids },
        userId: new Types.ObjectId(userId)
      },
      { $set: { folder } }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      },
      message: `成功移动 ${result.modifiedCount} 个联系人到文件夹 "${folder}"`
    });
  });

  /**
   * 更新联系人标签
   */
  static updateTags = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { tags } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(tags)) {
      throw new ApiError(400, '标签必须是数组格式');
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $set: { tags } },
      { new: true, runValidators: true }
    );

    if (!contact) {
      throw new ApiError(404, '联系人不存在');
    }

    res.json({
      success: true,
      data: contact,
      message: '标签更新成功'
    });
  });

  /**
   * 获取联系人统计信息
   */
  static getStats = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const stats = await Contact.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
          byIndustry: [
            { $group: { _id: '$basicInfo.industry', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          byFolder: [
            { $group: { _id: '$folder', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          recentlyAdded: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { 'basicInfo.name': 1, 'basicInfo.company': 1, createdAt: 1 } }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      data: {
        total: result.total[0]?.count || 0,
        byPriority: result.byPriority,
        byIndustry: result.byIndustry,
        byFolder: result.byFolder,
        recentlyAdded: result.recentlyAdded
      }
    });
  });
}

export default ContactController;